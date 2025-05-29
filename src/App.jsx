import { useState } from "react";
import Biseccion from "./Biseccion.jsx";
import PuntoFijo from "./punto-fijo.jsx";
import ReglaFalsa from "./regla-falsa.jsx";
import Newton from "./Newton.jsx";
import MultipleRoots from "./MultipleRoots.jsx";
function App() {
  const [metodo, setMetodo] = useState("");

  return (
    <div className="container">
      <h1>Calculadora de Métodos Numéricos</h1>

      <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
        <option value="">Selecciona un método...</option>
        <option value="Biseccion">Método de Bisección</option>
        <option value="Punto Fijo">Método de Punto Fijo</option>
        <option value="Regla Falsa">Método de Regla Falsa</option>
        <option value="Newton">Método de Newton</option>
        <option value="Raices Multiples">Método de Raices Multiples</option>
      </select>

      <div className="metodo-container">
        {metodo === "Biseccion" && <Biseccion />}
      </div>

      <div className="metodo-container">
        {metodo === "Punto Fijo" && <PuntoFijo />}
      </div>

      <div className="metodo-container">
        {metodo === "Regla Falsa" && <ReglaFalsa />}
      </div>

      <div className="metodo-container">
        {metodo === "Newton" && <Newton />}
      </div>

      <div className="metodo-container">
        {metodo === "Raices Multiples" && <MultipleRoots />}
      </div>
      <br></br>
      <div className="button-group">
        <a href="https://aquinter10.github.io/proyecto-analisis-numerico/" className="button">Go back Home</a>
      </div>
    </div>
  );
}

export default App;
