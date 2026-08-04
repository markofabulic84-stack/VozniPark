"use client";

import { useState } from "react";

export default function FuelCalculator() {
  const [numVehicles, setNumVehicles] = useState(6);
  const [fuelCost, setFuelCost] = useState(450);
  const savings = Math.round(numVehicles * fuelCost * 0.06);

  return (
    <div className="calc">
      <div>
        <div className="calc-field">
          <label>Broj vozila</label>
          <input
            type="range"
            min={1}
            max={30}
            value={numVehicles}
            onChange={(e) => setNumVehicles(Number(e.target.value))}
          />
          <div className="val mono">{numVehicles} vozila</div>
        </div>
        <div className="calc-field">
          <label>Prosječan mjesečni trošak goriva po vozilu</label>
          <input
            type="range"
            min={100}
            max={1200}
            step={50}
            value={fuelCost}
            onChange={(e) => setFuelCost(Number(e.target.value))}
          />
          <div className="val mono">{fuelCost} €</div>
        </div>
      </div>
      <div className="calc-result">
        <div className="big mono">
          {savings.toLocaleString("hr-HR")} €/mj
        </div>
        <div className="cap">
          procijenjena ušteda kroz raniju detekciju odstupanja potrošnje (~6%)
        </div>
        <div className="disc">
          Orijentacijska procjena radi ilustracije, ne jamstvo uštede.
        </div>
      </div>
    </div>
  );
}
