import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import './App.css';
import puntofijogif from '/punto-fijo.gif';

function PuntoFijo() {
  const [functionExpression, setFunctionExpression] = useState('x^2 - 3');
  const [gFunctionExpression, setGFunctionExpression] = useState('sqrt(3)');
  const [initialValue, setInitialValue] = useState('1');
  const [tolerance, setTolerance] = useState('0.0001');
  const [maxIterations, setMaxIterations] = useState('100');
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  // Parse and evaluate the function f(x)
  const evaluateFunction = (x) => {
    try {
      const scope = { x };
      return math.evaluate(functionExpression, scope);
    } catch (err) {
      console.error('Error evaluating function:', err);
      return NaN;
    }
  };

  // Parse and evaluate the function g(x)
  const evaluateGFunction = (x) => {
    try {
      const scope = { x };
      return math.evaluate(gFunctionExpression, scope);
    } catch (err) {
      console.error('Error evaluating g function:', err);
      return NaN;
    }
  };

  // Draw the graph on canvas
  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Set coordinate system (origin at center)
    const originX = width / 2;
    const originY = height / 2;
    
    // Scale - how many pixels per unit
    const scaleX = 50;
    const scaleY = 50;
    
    // Draw axes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // x-axis
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    // y-axis
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    // Vertical grid lines
    for (let x = originX % scaleX; x < width; x += scaleX) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    // Horizontal grid lines
    for (let y = originY % scaleY; y < height; y += scaleY) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    
    // Draw numbers on axes
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // X-axis numbers
    for (let i = -Math.floor(originX / scaleX); i <= Math.floor((width - originX) / scaleX); i++) {
      if (i === 0) continue; // Skip origin
      const x = originX + i * scaleX;
      ctx.fillText(i.toString(), x, originY + 5);
    }
    
    // Y-axis numbers
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = -Math.floor(originY / scaleY); i <= Math.floor((height - originY) / scaleY); i++) {
      if (i === 0) continue; // Skip origin
      const y = originY - i * scaleY;
      ctx.fillText(i.toString(), originX - 5, y);
    }
    
    // Draw f(x) - the original function
    ctx.strokeStyle = '#2C7FB8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let isFirst = true;
    
    for (let pixelX = 0; pixelX < width; pixelX++) {
      // Convert from pixel coordinates to math coordinates
      const x = (pixelX - originX) / scaleX;
      
      const y = evaluateFunction(x);
      
      // Convert from math coordinates to pixel coordinates
      const pixelY = originY - y * scaleY;
      
      if (isFirst) {
        ctx.moveTo(pixelX, pixelY);
        isFirst = false;
      } else {
        ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();
    
    // Draw g(x) - the iteration function
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    isFirst = true;
    
    for (let pixelX = 0; pixelX < width; pixelX++) {
      // Convert from pixel coordinates to math coordinates
      const x = (pixelX - originX) / scaleX;
      
      const y = evaluateGFunction(x);
      
      // Convert from math coordinates to pixel coordinates
      const pixelY = originY - y * scaleY;
      
      if (isFirst) {
        ctx.moveTo(pixelX, pixelY);
        isFirst = false;
      } else {
        ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();
    
    // Draw y = x line (for fixed point visualization)
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw the root and iterations if we have a result
    if (result && steps.length > 0) {
      // Draw iterations as connected dots
      ctx.strokeStyle = '#38B000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      const x0 = parseFloat(initialValue);
      let pixelX = originX + x0 * scaleX;
      let pixelY = originY - x0 * scaleY;
      
      ctx.moveTo(pixelX, pixelY);
      
      for (let i = 0; i < Math.min(steps.length, 15); i++) { // Limit to 15 iterations for visibility
        const step = steps[i];
        
        // Draw line to g(x)
        pixelY = originY - step.gx * scaleY;
        ctx.lineTo(pixelX, pixelY);
        
        // Draw line to y = x (next x value)
        pixelX = originX + step.gx * scaleX;
        ctx.lineTo(pixelX, pixelY);
      }
      
      ctx.stroke();
      
      // Draw the root
      const rootX = originX + result.root * scaleX;
      const rootY = originY - result.root * scaleY;
      
      ctx.fillStyle = '#38B000';
      ctx.beginPath();
      ctx.arc(rootX, rootY, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Fixed point method implementation
  const calculateRoot = () => {
    try {
      let x0 = parseFloat(initialValue);
      const tol = parseFloat(tolerance);
      const maxIter = parseInt(maxIterations);
      
      // Validate inputs
      if (isNaN(x0) || isNaN(tol) || isNaN(maxIter)) {
        setError('Por favor, ingresa valores numéricos válidos');
        return;
      }
      
      // Check if g(x) is valid 
      const gx0 = evaluateGFunction(x0);
      if (isNaN(gx0)) {
        setError('La función g(x) no es válida o no está definida en el punto inicial');
        return;
      }
      
      setError('');
      let newSteps = [];
      let iteration = 0;
      let x1, err;
      
      do {
        // Calculate next iteration
        x1 = evaluateGFunction(x0);
        
        // Calculate error
        err = Math.abs(x1 - x0);
        
        // Add step to history
        newSteps.push({
          iteration: iteration + 1,
          x: x0,
          gx: x1,
          fx: evaluateFunction(x1),
          error: err
        });
        
        // Update for next iteration
        x0 = x1;
        iteration++;
        
      } while (err > tol && iteration < maxIter && !isNaN(x1));
      
      // Check if the method converged
      if (isNaN(x1)) {
        setError('El método diverge o lleva a un valor indefinido');
        return;
      }
      
      if (iteration >= maxIter && err > tol) {
        setError('El método no converge después de ' + maxIter + ' iteraciones');
      }
      
      setSteps(newSteps);
      setResult({
        root: x1,
        functionValue: evaluateFunction(x1),
        iterations: iteration,
        error: err
      });
      
    } catch (err) {
      setError('Error en el cálculo: ' + err.message);
    }
  };

  // Update graph when function or result changes
  useEffect(() => {
    drawGraph();
  }, [functionExpression, gFunctionExpression, result]);

  // Initialize graph on component mount
  useEffect(() => {
    drawGraph();
  }, []);

  return (
    <div className="app-container">
      <h1>Calculador de Raíces - Método de Punto Fijo</h1>
      
      <div className="main-content">
        <div className="graph-container">
          <canvas ref={canvasRef} width={600} height={400} />
          <div className="graph-legend">
            <div><span className="legend-color" style={{backgroundColor: '#2C7FB8'}}></span>f(x) = {functionExpression}</div>
            <div><span className="legend-color" style={{backgroundColor: '#FF6B6B'}}></span>g(x) = {gFunctionExpression}</div>
            <div><span className="legend-color" style={{backgroundColor: '#6c757d'}}></span>y = x</div>
          </div>
        </div>
        
        <div className="right-section">
          <div className="controls-container">
            <div className="form-group">
              <label>Función f(x):</label>
              <input
                type="text"
                value={functionExpression}
                onChange={(e) => setFunctionExpression(e.target.value)}
                placeholder="Ej: x^2 - 3"
              />
            </div>
            
            <div className="form-group">
              <label>Función g(x):</label>
              <input
                type="text"
                value={gFunctionExpression}
                onChange={(e) => setGFunctionExpression(e.target.value)}
                placeholder="Ej: sqrt(3)"
              />
              <small className="form-text text-muted">
                La función g(x) debe ser tal que g(x) = x en la raíz.
                Ejemplo: Si f(x) = x^2 - 3, puedes usar g(x) = sqrt(3)
              </small>
            </div>
            
            <div className="form-group">
              <label>Valor inicial (x₀):</label>
              <input
                type="text"
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Tolerancia:</label>
              <input
                type="text"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Iteraciones máximas:</label>
              <input
                type="text"
                value={maxIterations}
                onChange={(e) => setMaxIterations(e.target.value)}
              />
            </div>
            
            <button className="calculate-btn" onClick={calculateRoot}>
              Calcular Raíz
            </button>
            
            {error && <div className="error-message">{error}</div>}
            
            {result && (
              <div className="result-container">
                <h3>Resultado:</h3>
                <p>Raíz encontrada: {result.root.toFixed(6)}</p>
                <p>Valor de f(x): {result.functionValue.toFixed(6)}</p>
                <p>Iteraciones: {result.iterations}</p>
                <p>Error: {result.error.toFixed(6)}</p>
              </div>
            )}
          </div>
          
          <div className="gif-container">
            <img src={puntofijogif} alt="Animación del método de punto fijo" className="method-gif" />
            <p className="gif-caption">Visualización del método de punto fijo</p>
          </div>
        </div>
      </div>
      
      {steps.length > 0 && (
        <div className="steps-container">
          <h3>Historial de iteraciones:</h3>
          <table>
            <thead>
              <tr>
                <th>Iter</th>
                <th>x</th>
                <th>g(x)</th>
                <th>f(g(x))</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.iteration}>
                  <td>{step.iteration}</td>
                  <td>{step.x.toFixed(6)}</td>
                  <td>{step.gx.toFixed(6)}</td>
                  <td>{step.fx.toFixed(6)}</td>
                  <td>{step.error.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PuntoFijo;
