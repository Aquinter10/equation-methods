import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import './App.css';
import bisectiongif from '/bisection.gif'

function App() {
  const [functionExpression, setFunctionExpression] = useState('x^2 - 3');
  const [lowerBound, setLowerBound] = useState('-3');
  const [upperBound, setUpperBound] = useState('1');
  const [tolerance, setTolerance] = useState('0.0001');
  const [maxIterations, setMaxIterations] = useState('1000');
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  // Parse and evaluate the function
  const evaluateFunction = (x) => {
    try {
      const scope = { x };
      return math.evaluate(functionExpression, scope);
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
        ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();
    
    // Draw bisection bounds if we have a result
    if (result && steps.length > 0) {
      const initialLower = parseFloat(lowerBound);
      const initialUpper = parseFloat(upperBound);
      
      // Draw initial bounds
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const pixelLower = originX + initialLower * scaleX;
      const pixelUpper = originX + initialUpper * scaleX;
      
      // Lower bound line
      ctx.moveTo(pixelLower, 0);
      ctx.lineTo(pixelLower, height);
      
      // Upper bound line
      ctx.moveTo(pixelUpper, 0);
      ctx.lineTo(pixelUpper, height);
      ctx.stroke();
      
      // Draw the root
      const rootX = originX + result.root * scaleX;
      const rootY = originY - evaluateFunction(result.root) * scaleY;
      
      ctx.fillStyle = '#38B000';
      ctx.beginPath();
      ctx.arc(rootX, rootY, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Bisection method implementation
  const calculateRoot = () => {
    try {
      let a = parseFloat(lowerBound);
      let b = parseFloat(upperBound);
      const tol = parseFloat(tolerance);
      const maxIter = parseInt(maxIterations);
      
      // Validate inputs
      if (isNaN(a) || isNaN(b) || isNaN(tol) || isNaN(maxIter)) {
        setError('Por favor, ingresa valores numéricos válidos');
        return;
      }
      
      let fa = evaluateFunction(a);
      let fb = evaluateFunction(b);
      
      // Check if the function changes sign in the interval
      if (fa * fb >= 0) {
        setError('La función debe cambiar de signo en el intervalo [a, b]');
        return;
      }
      
      setError('');
      let newSteps = [];
      let c, fc;
      let iteration = 0;
      let err = Math.abs(b - a);
      
      while (err > tol && iteration < maxIter) {
        // Calculate midpoint
        c = (a + b) / 2;
        fc = evaluateFunction(c);
        
        // Add step to history
        newSteps.push({
          iteration: iteration + 1,
          a,
          b,
          c,
          fa: evaluateFunction(a),
          fb: evaluateFunction(b),
          fc,
          error: err
        });
        
        // Update interval
        if (fc === 0) {
          break; // Exact solution found
        } else if (fa * fc < 0) {
          b = c;
          fb = fc;
        } else {
          a = c;
          fa = fc;
        }
        
        // Update error
        err = Math.abs(b - a);
        iteration++;
      }
      
      setSteps(newSteps);
      setResult({
        root: c,
        functionValue: fc,
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
      <h1>Calculador de Raíces - Método de Bisección</h1>
      
      <div className="main-content">
        <div className="graph-container">
          <canvas ref={canvasRef} width={700} height={800} />
        </div>
        
        <div className="right-section">
          <div className="controls-container">
            <div className="form-group">
              <label>Función f(x):</label>
              <input
                type="text"
                value={functionExpression}
                onChange={(e) => setFunctionExpression(e.target.value)}
                placeholder="Ej: x^2 - 4"
              />
            </div>
            
            <div className="form-group">
              <label>Límite inferior (a):</label>
              <input
                type="text"
                value={lowerBound}
                onChange={(e) => setLowerBound(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Límite superior (b):</label>
              <input
                type="text"
                value={upperBound}
                onChange={(e) => setUpperBound(e.target.value)}
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
            <img src={bisectiongif} alt="Animación del método de bisección" className="method-gif" />
            <p className="gif-caption">Visualización del método de bisección</p>
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
                <th>a</th>
                <th>b</th>
                <th>c</th>
                <th>f(a)</th>
                <th>f(b)</th>
                <th>f(c)</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.iteration}>
                  <td>{step.iteration}</td>
                  <td>{step.a.toFixed(6)}</td>
                  <td>{step.b.toFixed(6)}</td>
                  <td>{step.c.toFixed(6)}</td>
                  <td>{step.fa.toFixed(6)}</td>
                  <td>{step.fb.toFixed(6)}</td>
                  <td>{step.fc.toFixed(6)}</td>
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

export default App;