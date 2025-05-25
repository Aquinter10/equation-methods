import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import './App.css';
import multipleRootsGif from '/multipleroot.gif';

function MultipleRootsApp() {
  const [functionExpression, setFunctionExpression] = useState('x^3 - 2*x^2 + 4/3*x - 8/27');
  const [initialGuess, setInitialGuess] = useState('0.5');
  const [tolerance, setTolerance] = useState('0.0001');
  const [maxIterations, setMaxIterations] = useState('100');
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  // Parse and evaluate the function and its derivatives
  const evaluateFunction = (x, type = 'function') => {
    try {
      const scope = { x };
      if (type === 'function') {
        return math.evaluate(functionExpression, scope);
      } else if (type === 'firstDerivative') {
        const node = math.parse(functionExpression);
        const derivative = math.derivative(node, 'x');
        return derivative.evaluate(scope);
      } else if (type === 'secondDerivative') {
        const node = math.parse(functionExpression);
        const firstDerivative = math.derivative(node, 'x');
        const secondDerivative = math.derivative(firstDerivative, 'x');
        return secondDerivative.evaluate(scope);
      }
      return NaN;
    } catch (err) {
      console.error('Error evaluating function:', err);
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
    
    // Draw the function
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
        // Skip drawing if the value is too large (asymptotes)
        if (Math.abs(pixelY - originY) < height * 2) {
          ctx.lineTo(pixelX, pixelY);
        } else {
          isFirst = true; // Start a new line segment
        }
      }
    }
    ctx.stroke();
    
    // Draw the root if found
    if (result) {
      const rootX = originX + result.root * scaleX;
      const rootY = originY - evaluateFunction(result.root) * scaleY;
      
      ctx.fillStyle = '#38B000';
      ctx.beginPath();
      ctx.arc(rootX, rootY, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw tangent line at initial guess
      if (steps.length > 0) {
        const initialX = parseFloat(initialGuess);
        const initialY = evaluateFunction(initialX);
        const derivative = evaluateFunction(initialX, 'firstDerivative');
        
        // Calculate two points for the tangent line
        const x1 = initialX - 2;
        const y1 = initialY - derivative * (x1 - initialX);
        const x2 = initialX + 2;
        const y2 = initialY + derivative * (x2 - initialX);
        
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(originX + x1 * scaleX, originY - y1 * scaleY);
        ctx.lineTo(originX + x2 * scaleX, originY - y2 * scaleY);
        ctx.stroke();
      }
    }
  };

  // Modified Newton-Raphson method for multiple roots
  const calculateRoot = () => {
    try {
      let x0 = parseFloat(initialGuess);
      const tol = parseFloat(tolerance);
      const maxIter = parseInt(maxIterations);
      
      // Validate inputs
      if (isNaN(x0) || isNaN(tol) || isNaN(maxIter)) {
        setError('Por favor, ingresa valores numéricos válidos');
        return;
      }
      
      let fx = evaluateFunction(x0);
      let fpx = evaluateFunction(x0, 'firstDerivative');
      let fppx = evaluateFunction(x0, 'secondDerivative');
      
      setError('');
      let newSteps = [];
      let x1;
      let err = tol + 1;
      let iteration = 0;
      
      while (err > tol && iteration < maxIter) {
        // Modified Newton-Raphson formula for multiple roots
        const numerator = fx * fpx;
        const denominator = Math.pow(fpx, 2) - fx * fppx;
        
        if (Math.abs(denominator) < 1e-10) {
          setError('División por cero. El método no converge.');
          return;
        }
        
        x1 = x0 - numerator / denominator;
        fx = evaluateFunction(x1);
        fpx = evaluateFunction(x1, 'firstDerivative');
        fppx = evaluateFunction(x1, 'secondDerivative');
        
        err = Math.abs(x1 - x0);
        
        // Add step to history
        newSteps.push({
          iteration: iteration + 1,
          x: x0,
          fx: evaluateFunction(x0),
          fpx: evaluateFunction(x0, 'firstDerivative'),
          fppx: evaluateFunction(x0, 'secondDerivative'),
          nextX: x1,
          error: err
        });
        
        x0 = x1;
        iteration++;
      }
      
      setSteps(newSteps);
      setResult({
        root: x1,
        functionValue: fx,
        derivativeValue: fpx,
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
  }, [functionExpression, result]);

  // Initialize graph on component mount
  useEffect(() => {
    drawGraph();
  }, []);

  return (
    <div className="app-container">
      <h1>Calculador de Raíces Múltiples - Método de Newton-Raphson Modificado</h1>
      
      <div className="main-content">
        <div className="graph-container">
          <canvas ref={canvasRef} width={600} height={400} />
        </div>
        
        <div className="right-section">
          <div className="controls-container">
            <div className="form-group">
              <label>Función f(x):</label>
              <input
                type="text"
                value={functionExpression}
                onChange={(e) => setFunctionExpression(e.target.value)}
                placeholder="Ej: x^3 - 2x^2 + (4/3)x - 8/27"
              />
            </div>
            
            <div className="form-group">
              <label>Valor inicial (x₀):</label>
              <input
                type="text"
                value={initialGuess}
                onChange={(e) => setInitialGuess(e.target.value)}
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
                <p>Valor de f'(x): {result.derivativeValue.toFixed(6)}</p>
                <p>Iteraciones: {result.iterations}</p>
                <p>Error: {result.error.toFixed(6)}</p>
              </div>
            )}
          </div>
          
          <div className="gif-container">
            <img src={multipleRootsGif} alt="Animación del método de raíces múltiples" className="method-gif" />
            <p className="gif-caption">Visualización del método de Newton modificado para raíces múltiples</p>
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
                <th>xₙ</th>
                <th>f(xₙ)</th>
                <th>f'(xₙ)</th>
                <th>f''(xₙ)</th>
                <th>xₙ₊₁</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.iteration}>
                  <td>{step.iteration}</td>
                  <td>{step.x.toFixed(6)}</td>
                  <td>{step.fx.toFixed(6)}</td>
                  <td>{step.fpx.toFixed(6)}</td>
                  <td>{step.fppx.toFixed(6)}</td>
                  <td>{step.nextX.toFixed(6)}</td>
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

export default MultipleRootsApp;