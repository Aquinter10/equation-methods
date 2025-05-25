// ReglaFalsa.jsx
import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import './App.css';
import falsigif from '/falseposition.gif';

function ReglaFalsa() {
  const [functionExpression, setFunctionExpression] = useState('x^2 - 3');
  const [lowerBound, setLowerBound] = useState('-3');
  const [upperBound, setUpperBound] = useState('1');
  const [tolerance, setTolerance] = useState('0.0001');
  const [maxIterations, setMaxIterations] = useState('1000');
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const evaluateFunction = (x) => {
    try {
      return math.evaluate(functionExpression, { x });
    } catch {
      return NaN;
    }
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2;
    const scaleX = 50;
    const scaleY = 50;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    for (let x = originX % scaleX; x < width; x += scaleX) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = originY % scaleY; y < height; y += scaleY) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -Math.floor(originX / scaleX); i <= Math.floor((width - originX) / scaleX); i++) {
      if (i !== 0) ctx.fillText(i.toString(), originX + i * scaleX, originY + 5);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = -Math.floor(originY / scaleY); i <= Math.floor((height - originY) / scaleY); i++) {
      if (i !== 0) ctx.fillText(i.toString(), originX - 5, originY - i * scaleY);
    }

    ctx.strokeStyle = '#2C7FB8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let px = 0; px < width; px++) {
      const x = (px - originX) / scaleX;
      const y = evaluateFunction(x);
      const py = originY - y * scaleY;
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    if (result && steps.length > 0) {
      const pixelA = originX + parseFloat(lowerBound) * scaleX;
      const pixelB = originX + parseFloat(upperBound) * scaleX;
      ctx.strokeStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.moveTo(pixelA, 0);
      ctx.lineTo(pixelA, height);
      ctx.moveTo(pixelB, 0);
      ctx.lineTo(pixelB, height);
      ctx.stroke();

      const rootX = originX + result.root * scaleX;
      const rootY = originY - evaluateFunction(result.root) * scaleY;
      ctx.fillStyle = '#38B000';
      ctx.beginPath();
      ctx.arc(rootX, rootY, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const calculateRoot = () => {
    try {
      let a = parseFloat(lowerBound);
      let b = parseFloat(upperBound);
      const tol = parseFloat(tolerance);
      const maxIter = parseInt(maxIterations);

      let fa = evaluateFunction(a);
      let fb = evaluateFunction(b);

      if (fa * fb >= 0) {
        setError('La función debe cambiar de signo en el intervalo [a, b]');
        return;
      }

      let newSteps = [];
      let iteration = 0;
      let c, fc;
      let err = Math.abs(b - a);
      setError('');

      while (err > tol && iteration < maxIter) {
        c = (a * fb - b * fa) / (fb - fa);
        fc = evaluateFunction(c);
        newSteps.push({ iteration: iteration + 1, a, b, c, fa, fb, fc, error: err });

        if (fc === 0) break;
        if (fa * fc < 0) {
          b = c;
          fb = fc;
        } else {
          a = c;
          fa = fc;
        }
        err = Math.abs(b - a);
        iteration++;
      }

      setSteps(newSteps);
      setResult({ root: c, functionValue: fc, iterations: iteration, error: err });
    } catch (err) {
      setError('Error en el cálculo: ' + err.message);
    }
  };

  useEffect(() => {
    drawGraph();
  }, [functionExpression, result]);

  useEffect(() => {
    drawGraph();
  }, []);

  return (
    <div className="app-container">
      <h1>Calculador de Raíces - Método de Regla Falsa</h1>
      <div className="main-content">
        <div className="graph-container">
          <canvas ref={canvasRef} width={600} height={400} />
        </div>
        <div className="right-section">
          <div className="controls-container">
            <div className="form-group">
              <label>Función f(x):</label>
              <input type="text" value={functionExpression} onChange={(e) => setFunctionExpression(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Límite inferior (a):</label>
              <input type="text" value={lowerBound} onChange={(e) => setLowerBound(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Límite superior (b):</label>
              <input type="text" value={upperBound} onChange={(e) => setUpperBound(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tolerancia:</label>
              <input type="text" value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Iteraciones máximas:</label>
              <input type="text" value={maxIterations} onChange={(e) => setMaxIterations(e.target.value)} />
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
            <img src={falsigif} alt="Animación del método de regla falsa" className="method-gif" />
            <p className="gif-caption">Visualización del método de regla falsa</p>
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

export default ReglaFalsa;
