import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import './App.css';
import newtongif from '/newton.gif';

function Newton() {
  const [functionExpression, setFunctionExpression] = useState('x^2 - 3');
  const [derivativeExpression, setDerivativeExpression] = useState('');
  const [compiledDerivative, setCompiledDerivative] = useState(null);
  const [initialGuess, setInitialGuess] = useState('1');
  const [tolerance, setTolerance] = useState('0.0001');
  const [maxIterations, setMaxIterations] = useState('100');
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

  const calculateDerivative = () => {
    try {
      const node = math.parse(functionExpression);
      const derivativeNode = math.derivative(node, 'x');
      const compiled = derivativeNode.compile();
      setDerivativeExpression(derivativeNode.toString());
      setCompiledDerivative(compiled);
      setError('');
    } catch (err) {
      setError('Error al calcular la derivada: ' + err.message);
      setDerivativeExpression('');
      setCompiledDerivative(null);
    }
  };

  const evaluateDerivative = (x) => {
    try {
      return compiledDerivative ? compiledDerivative.evaluate({ x }) : NaN;
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

    if (result) {
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
      let x = parseFloat(initialGuess);
      const tol = parseFloat(tolerance);
      const maxIter = parseInt(maxIterations);
      let iteration = 0;
      let errorAbs = 1;
      const newSteps = [];

      setError('');

      while (iteration < maxIter && errorAbs > tol) {
        const fx = evaluateFunction(x);
        const dfx = evaluateDerivative(x);

        if (dfx === 0) {
          setError('La derivada se volvió cero. No se puede continuar.');
          return;
        }

        const x1 = x - fx / dfx;
        errorAbs = Math.abs(x1 - x);

        newSteps.push({
          iteration: iteration + 1,
          x,
          fx,
          dfx,
          x1,
          error: errorAbs,
        });

        x = x1;
        iteration++;
      }

      setSteps(newSteps);
      setResult({ root: x, functionValue: evaluateFunction(x), iterations: iteration, error: errorAbs });
    } catch (err) {
      setError('Error en el cálculo: ' + err.message);
    }
  };

  useEffect(() => {
    try {
      const node = math.parse(functionExpression);
      const derivativeNode = math.derivative(node, 'x');
      const compiled = derivativeNode.compile();
      setCompiledDerivative(compiled);
      setError('');
    } catch (err) {
      setCompiledDerivative(null);
      setError('Error al derivar automáticamente: ' + err.message);
    }
    drawGraph();
  }, [functionExpression]);

  return (
    <div className="app-container">
      <h1>Calculador de Raíces - Método de Newton-Raphson</h1>
      <div className="main-content">
        <div className="graph-container">
          <canvas ref={canvasRef} width={700} height={800} />
        </div>
        <div className="right-section">
          <div className="controls-container">
            <div className="form-group">
              <label>Función f(x):</label>
              <input type="text" value={functionExpression} onChange={(e) => setFunctionExpression(e.target.value)} />
            </div>
            <div className="form-group">
              <button onClick={calculateDerivative}>Calcular Derivada</button>
                {derivativeExpression && (
                  <p>f'(x) = {derivativeExpression}</p>
                )}
            </div>
            <div className="form-group">
              <label>Valor inicial x₀:</label>
              <input type="text" value={initialGuess} onChange={(e) => setInitialGuess(e.target.value)} />
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
            <img src={newtongif} alt="Animación del método de Newton-Raphson" className="method-gif" />
            <p className="gif-caption">Visualización del método de Newton-Raphson</p>
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
                <th>f(x)</th>
                <th>f'(x)</th>
                <th>x₁</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.iteration}>
                  <td>{step.iteration}</td>
                  <td>{step.x.toFixed(6)}</td>
                  <td>{step.fx.toFixed(6)}</td>
                  <td>{step.dfx.toFixed(6)}</td>
                  <td>{step.x1.toFixed(6)}</td>
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

export default Newton;
