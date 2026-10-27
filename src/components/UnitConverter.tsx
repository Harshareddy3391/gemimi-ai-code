import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Ruler, Scale, Thermometer, HardDrive, Gauge, Maximize2, Layers } from 'lucide-react';
import { CalculatorApiService } from '../services/api';

interface CategoryConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  units: { id: string; label: string; symbol: string }[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'length',
    name: 'Length',
    icon: Ruler,
    units: [
      { id: 'meter', label: 'Meters', symbol: 'm' },
      { id: 'kilometer', label: 'Kilometers', symbol: 'km' },
      { id: 'centimeter', label: 'Centimeters', symbol: 'cm' },
      { id: 'millimeter', label: 'Millimeters', symbol: 'mm' },
      { id: 'mile', label: 'Miles', symbol: 'mi' },
      { id: 'yard', label: 'Yards', symbol: 'yd' },
      { id: 'foot', label: 'Feet', symbol: 'ft' },
      { id: 'inch', label: 'Inches', symbol: 'in' },
      { id: 'nautical_mile', label: 'Nautical Miles', symbol: 'NM' },
    ],
  },
  {
    id: 'mass',
    name: 'Mass & Weight',
    icon: Scale,
    units: [
      { id: 'kilogram', label: 'Kilograms', symbol: 'kg' },
      { id: 'gram', label: 'Grams', symbol: 'g' },
      { id: 'milligram', label: 'Milligrams', symbol: 'mg' },
      { id: 'pound', label: 'Pounds', symbol: 'lb' },
      { id: 'ounce', label: 'Ounces', symbol: 'oz' },
      { id: 'metric_ton', label: 'Metric Tons', symbol: 't' },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    icon: Thermometer,
    units: [
      { id: 'celsius', label: 'Celsius', symbol: '°C' },
      { id: 'fahrenheit', label: 'Fahrenheit', symbol: '°F' },
      { id: 'kelvin', label: 'Kelvin', symbol: 'K' },
    ],
  },
  {
    id: 'data',
    name: 'Digital Data',
    icon: HardDrive,
    units: [
      { id: 'byte', label: 'Bytes', symbol: 'B' },
      { id: 'kilobyte', label: 'Kilobytes', symbol: 'KB' },
      { id: 'megabyte', label: 'Megabytes', symbol: 'MB' },
      { id: 'gigabyte', label: 'Gigabytes', symbol: 'GB' },
      { id: 'terabyte', label: 'Terabytes', symbol: 'TB' },
      { id: 'bit', label: 'Bits', symbol: 'b' },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    icon: Gauge,
    units: [
      { id: 'm/s', label: 'Meters per second', symbol: 'm/s' },
      { id: 'km/h', label: 'Kilometers per hour', symbol: 'km/h' },
      { id: 'mph', label: 'Miles per hour', symbol: 'mph' },
      { id: 'knot', label: 'Knots', symbol: 'kn' },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    icon: Maximize2,
    units: [
      { id: 'sq_meter', label: 'Square Meters', symbol: 'm²' },
      { id: 'sq_kilometer', label: 'Square Kilometers', symbol: 'km²' },
      { id: 'sq_foot', label: 'Square Feet', symbol: 'ft²' },
      { id: 'acre', label: 'Acres', symbol: 'ac' },
      { id: 'hectare', label: 'Hectares', symbol: 'ha' },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: Layers,
    units: [
      { id: 'liter', label: 'Liters', symbol: 'L' },
      { id: 'milliliter', label: 'Milliliters', symbol: 'mL' },
      { id: 'cubic_meter', label: 'Cubic Meters', symbol: 'm³' },
      { id: 'us_gallon', label: 'US Gallons', symbol: 'gal' },
      { id: 'us_cup', label: 'US Cups', symbol: 'cup' },
    ],
  },
];

export const UnitConverter: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('length');
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [toUnit, setToUnit] = useState<string>('foot');
  const [inputValue, setInputValue] = useState<number>(1);
  const [outputValue, setOutputValue] = useState<number>(3.28084);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCat) || CATEGORIES[0];

  useEffect(() => {
    // Reset units when category changes
    if (activeCategory.units.length >= 2) {
      setFromUnit(activeCategory.units[0].id);
      setToUnit(activeCategory.units[1].id);
    }
  }, [selectedCat]);

  useEffect(() => {
    let isCancelled = false;
    const convert = async () => {
      try {
        const res = await CalculatorApiService.convertUnit(selectedCat, fromUnit, toUnit, inputValue);
        if (!isCancelled) {
          setOutputValue(res.result);
        }
      } catch (e) {
        console.error(e);
      }
    };

    convert();
    return () => {
      isCancelled = true;
    };
  }, [selectedCat, fromUnit, toUnit, inputValue]);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
      {/* Category Pills Bar */}
      <div className="flex items-center overflow-x-auto pb-1 gap-1.5 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Conversion Cards */}
      <div className="rounded-2xl bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 shadow-xl p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM CARD */}
          <div className="md:col-span-5 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">From</span>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent font-mono text-3xl sm:text-4xl font-bold text-white focus:outline-none"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-300 font-medium focus:outline-none focus:border-cyan-500"
            >
              {activeCategory.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* SWAP BUTTON */}
          <div className="md:col-span-1 flex justify-center">
            <button
              onClick={swapUnits}
              className="p-3 rounded-full bg-slate-800 border border-slate-700 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition shadow-lg"
              title="Swap Units"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* TO CARD */}
          <div className="md:col-span-5 bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-3">
            <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">To (Result)</span>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-cyan-300 overflow-x-auto scrollbar-none select-all py-0.5">
              {outputValue}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-300 font-medium focus:outline-none focus:border-cyan-500"
            >
              {activeCategory.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Reference Multi-Table */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 block mb-3">
            Equivalent Values for {inputValue} {activeCategory.units.find((u) => u.id === fromUnit)?.label}:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {activeCategory.units
              .filter((u) => u.id !== fromUnit)
              .map((u) => (
                <UnitEquivalentItem
                  key={u.id}
                  category={selectedCat}
                  fromUnit={fromUnit}
                  toUnit={u.id}
                  value={inputValue}
                  label={u.label}
                  symbol={u.symbol}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UnitEquivalentItem: React.FC<{
  category: string;
  fromUnit: string;
  toUnit: string;
  value: number;
  label: string;
  symbol: string;
}> = ({ category, fromUnit, toUnit, value, label, symbol }) => {
  const [val, setVal] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    CalculatorApiService.convertUnit(category, fromUnit, toUnit, value)
      .then((res) => {
        if (active) setVal(res.result);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [category, fromUnit, toUnit, value]);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="font-mono text-sm font-semibold text-white mt-0.5 truncate select-all">
        {val !== null ? `${val} ${symbol}` : '...'}
      </span>
    </div>
  );
};
