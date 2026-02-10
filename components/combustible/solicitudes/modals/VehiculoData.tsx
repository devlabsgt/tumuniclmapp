import React, { useState, useRef, useEffect } from 'react';
import { Vehiculo } from '../types'; 
import { searchVehiculos } from '../actions'; 

const TIPOS_VEHICULO = ["Sedán", "Camioneta", "Pickup", "Camión", "Maquinaria", "Motocicleta"];
const TIPOS_COMBUSTIBLE = ["Gasolina", "Diesel"];

interface Props {
  vehiculo: Vehiculo;
  setVehiculo: React.Dispatch<React.SetStateAction<Vehiculo>>;
  isNewVehicle: boolean;
  setIsNewVehicle: (val: boolean) => void;
  kmInicial: number | '';
  setKmInicial: (val: number | '') => void;
}

export const VehiculoData: React.FC<Props> = ({ 
  vehiculo, setVehiculo, isNewVehicle, setIsNewVehicle, kmInicial, setKmInicial 
}) => {
  
  const [placaSearch, setPlacaSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Vehiculo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchingVeh, setIsSearchingVeh] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [tempNewVehicle, setTempNewVehicle] = useState({ tipo_vehiculo: '', modelo: '', tipo_combustible: '' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
      if(vehiculo.placa && placaSearch !== vehiculo.placa) {
          setPlacaSearch(vehiculo.placa);
      }
  }, [vehiculo.placa]); 


  const handleSearchPlaca = async (val: string) => {
    const upperVal = val.toUpperCase();
    setPlacaSearch(upperVal);
    
    if (upperVal.length === 0) {
        setSearchResults([]);
        setShowDropdown(false);
        setIsNewVehicle(false);
        setVehiculo({ placa: '', modelo: '', tipo_vehiculo: '', tipo_combustible: '' });
        return;
    }

    setVehiculo(prev => ({ ...prev, placa: upperVal }));
    setIsSearchingVeh(true);
    
    const results = await searchVehiculos(upperVal);
    setIsSearchingVeh(false);

    if (results && results.length > 0) {
        setSearchResults(results);
        setShowDropdown(true);
        setIsNewVehicle(false); 
    } else {
        setSearchResults([]);
        setShowDropdown(false);
        if (upperVal.length > 3) {
            setIsNewVehicle(true);
            setVehiculo(prev => ({ ...prev, placa: upperVal, modelo: '', tipo_vehiculo: '', tipo_combustible: '' }));
            setTempNewVehicle({ tipo_vehiculo: '', modelo: '', tipo_combustible: '' });
        }
    }
  };

  const handleSelectVehicle = (selected: Vehiculo) => {
    setVehiculo(selected);
    setPlacaSearch(selected.placa);
    setShowDropdown(false);
    setIsNewVehicle(false);
  };

  const handleSaveNewVehicle = () => {
    setVehiculo({
        ...vehiculo,
        tipo_vehiculo: tempNewVehicle.tipo_vehiculo,
        modelo: tempNewVehicle.modelo,
        tipo_combustible: tempNewVehicle.tipo_combustible
    });
    setShowNewVehicleModal(false);
  };

  const groupedVehicles = searchResults.reduce((acc, curr) => {
    const type = curr.tipo_vehiculo || 'OTROS';
    if (!acc[type]) acc[type] = [];
    acc[type].push(curr);
    return acc;
  }, {} as Record<string, Vehiculo[]>);

  return (
    <div className="lg:col-span-5 flex flex-col h-full">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-lg p-5 flex flex-col h-full relative overflow-visible">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -z-0"></div>

            <div className="flex justify-between items-start mb-6 z-10 relative">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Vehículo
                </h3>
                {isNewVehicle ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700">No Registrado</span>
                ) : vehiculo.tipo_vehiculo && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700">Verificado</span>
                )}
            </div>

            <div className="space-y-5 z-20 relative flex-1">
                <div ref={dropdownRef} className="relative">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 mb-2 uppercase text-center tracking-widest">Número de Placa</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={placaSearch} 
                            onChange={(e) => handleSearchPlaca(e.target.value)}
                            onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
                            className="w-full text-center text-3xl font-black uppercase tracking-[0.2em] py-3 border-2 border-gray-300 dark:border-neutral-600 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-neutral-700 transition-all font-mono"
                            placeholder="000XXX"
                            autoComplete="off"
                        />
                        {isSearchingVeh && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            </div>
                        )}
                    </div>

                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto text-left ring-1 ring-black/5">
                            {Object.entries(groupedVehicles).map(([tipo, vehiculos]) => (
                                <div key={tipo} className="border-b border-gray-100 dark:border-neutral-700 last:border-0">
                                    <div className="bg-gray-100 dark:bg-neutral-900/80 px-4 py-2 text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider sticky top-0 backdrop-blur-sm border-b border-gray-100 dark:border-neutral-700/50">
                                        {tipo}
                                    </div>
                                    <ul>
                                        {vehiculos.map((v, idx) => (
                                            <li 
                                                key={`${v.placa}-${idx}`}
                                                onMouseDown={() => handleSelectVehicle(v)}
                                                className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors flex justify-between items-center group border-l-4 border-transparent hover:border-blue-500"
                                            >
                                                <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-mono text-sm tracking-wide">{v.placa}</span>
                                                <span className="text-xs text-gray-500 dark:text-neutral-400">{v.modelo}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {isNewVehicle && (
                        <div className="mt-3 text-center animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium">Placa no encontrada en el sistema.</p>
                            <button 
                                onClick={() => setShowNewVehicleModal(true)}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                REGISTRAR DATOS DE {placaSearch}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                    <div className="col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Vehículo / Modelo</label>
                        <div className="bg-gray-100 dark:bg-neutral-800/50 rounded px-3 py-2 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 truncate font-medium h-9 flex items-center">
                            {vehiculo.tipo_vehiculo ? `${vehiculo.tipo_vehiculo} - ${vehiculo.modelo}` : <span className="text-gray-400 italic font-normal text-xs">Esperando placa...</span>}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Combustible</label>
                        <div className="bg-gray-100 dark:bg-neutral-800/50 rounded px-3 py-2 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 truncate font-medium h-9 flex items-center">
                            {vehiculo.tipo_combustible || '-'}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 block mb-1">Km Actual</label>
                        <div className="relative">
                            <input 
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={kmInicial} 
                                onChange={e => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) setKmInicial(val === '' ? '' : Number(val));
                                }} 
                                className="w-full border border-gray-300 dark:border-neutral-600 rounded px-3 py-1.5 text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none h-9 font-mono" 
                                placeholder="0"
                            />
                            <span className="absolute right-2 top-2 text-[10px] font-bold text-gray-400">KM</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {showNewVehicleModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowNewVehicleModal(false)}></div>
                <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-neutral-700 animate-in fade-in zoom-in duration-200 overflow-hidden">
                    <div className="bg-slate-900 dark:bg-neutral-950 px-5 py-4 flex justify-between items-center">
                        <h3 className="text-white font-bold">Registrar Vehículo Externo</h3>
                        <button onClick={() => setShowNewVehicleModal(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800 text-center">
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block mb-1">REGISTRANDO PLACA</span>
                            <span className="text-2xl font-black text-slate-800 dark:text-white tracking-widest">{placaSearch}</span>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Tipo de Vehículo</label>
                            <select
                                value={tempNewVehicle.tipo_vehiculo}
                                onChange={(e) => setTempNewVehicle({...tempNewVehicle, tipo_vehiculo: e.target.value})}
                                className="w-full border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:[color-scheme:dark]"
                            >
                                <option value="">Seleccione...</option>
                                {TIPOS_VEHICULO.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Modelo / Marca</label>
                            <input 
                                type="text"
                                value={tempNewVehicle.modelo}
                                onChange={(e) => setTempNewVehicle({...tempNewVehicle, modelo: e.target.value})}
                                placeholder="Ej. Toyota Hilux 2024"
                                className="w-full border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Combustible</label>
                            <select
                                value={tempNewVehicle.tipo_combustible}
                                onChange={(e) => setTempNewVehicle({...tempNewVehicle, tipo_combustible: e.target.value})}
                                className="w-full border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:[color-scheme:dark]"
                            >
                                <option value="">Seleccione...</option>
                                {TIPOS_COMBUSTIBLE.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={() => setShowNewVehicleModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveNewVehicle}
                                disabled={!tempNewVehicle.tipo_vehiculo || !tempNewVehicle.modelo || !tempNewVehicle.tipo_combustible}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};