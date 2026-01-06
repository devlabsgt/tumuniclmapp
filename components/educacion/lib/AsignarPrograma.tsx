'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

// Tipos
interface UserProfile {
  user_id: string;
  nombre: string;
  email: string;
  programas_asignados: string[] | null;
}

interface ProgramaEducativo {
    id: number;
    nombre: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function AsignarPrograma({ isOpen, onClose }: Props) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<ProgramaEducativo[]>([]);
  
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [originalUserIds, setOriginalUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filterAssigned, setFilterAssigned] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const usersResponse = await fetch('/api/users/listar-por-modulo?modulo=EDUCACION');
      if (!usersResponse.ok) throw new Error('Error al cargar usuarios');
      const usersData = await usersResponse.json();
      const sortedUsers = (usersData || []).sort((a: UserProfile, b: UserProfile) => a.email.localeCompare(b.email));
      setAllUsers(sortedUsers);

      const { data: programsData, error: programsError } = await supabase
        .from('programas_educativos').select('id, nombre').is('parent_id', null);
      if (programsError) throw programsError;
      setAvailablePrograms(programsData || []);

    } catch (error) {
      toast.error('Error al cargar los datos iniciales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProgram) {
      const usersWithProgram = allUsers.filter(user => 
        (user.programas_asignados || []).includes(selectedProgram)
      );
      const ids = usersWithProgram.map(user => user.user_id);
      setSelectedUserIds(ids);
      setOriginalUserIds(ids);
    } else {
      setSelectedUserIds([]);
      setOriginalUserIds([]);
    }
  }, [selectedProgram, allUsers]);

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgram(e.target.value);
  };

  const handleSwitchChange = (userId: string, isChecked: boolean) => {
    setSelectedUserIds(prevIds => 
      isChecked
        ? [...prevIds, userId]
        : prevIds.filter(id => id !== userId)
    );
  };

  const handleUpdate = async () => {
    if (!selectedProgram) {
        toast.error("Seleccione un programa primero.");
        return;
    }
    setSaving(true);
    const supabase = createClient();
    
    const usersOriginallyAssigned = allUsers.filter(user => 
      (user.programas_asignados || []).includes(selectedProgram)
    ).map(user => user.user_id);
    
    const toAssign = selectedUserIds.filter(userId => !usersOriginallyAssigned.includes(userId));
    const toUnassign = usersOriginallyAssigned.filter(userId => !selectedUserIds.includes(userId));
    
    const assignPromises = toAssign.map(userId => 
      supabase.from('accesos_programas').insert({ user_id: userId, programa: selectedProgram })
    );

    const unassignPromises = toUnassign.map(userId =>
      supabase.from('accesos_programas').delete().eq('user_id', userId).eq('programa', selectedProgram)
    );

    const results = await Promise.all([...assignPromises, ...unassignPromises]);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      toast.error(`Error al actualizar. Hubo problemas con ${errors.length} operación(es).`);
    } else {
      toast.success('Programas actualizados correctamente.');
      fetchData();
    }
    setSaving(false);
  };
  
  if (!isOpen) return null;

  const filteredPrograms = availablePrograms;

  let filteredUsers = allUsers.filter(user => user.email.toLowerCase().includes(userSearchTerm.toLowerCase()));
  if (filterAssigned) {
    filteredUsers = filteredUsers.filter(user => (user.programas_asignados || []).includes(selectedProgram));
  }
  
  const hasChanges = JSON.stringify(selectedUserIds.sort()) !== JSON.stringify(originalUserIds.sort());
  
  return (
    <div className="fixed inset-0 bg-white/30 dark:bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <motion.div 
        className="bg-slate-50 dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" 
        initial={{ opacity: 0, y: -30 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
            <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700">
                <h3 className="font-semibold mb-2 dark:text-gray-100">1. Seleccione un Programa</h3>
                <select
                    value={selectedProgram}
                    onChange={handleProgramChange}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100"
                >
                    <option value="">-- Seleccionar --</option>
                    {filteredPrograms.map(p => (
                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                </select>
            </div>

            <AnimatePresence>
            {selectedProgram && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative p-6 bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700"
                >
                  {saving && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-neutral-900/70 flex justify-center items-center z-10 rounded-lg">
                        <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">
                    2. Usuarios para: <span className="text-blue-600 dark:text-blue-500">{selectedProgram}</span>
                  </h3>
                  
                  <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <Input
                          placeholder="Filtrar usuario por email..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-9 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100 dark:placeholder-gray-500"
                      />
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setFilterAssigned(p => !p)}
                        className={`
                          relative inline-flex items-center h-6 rounded-full w-11 transition-colors
                          ${filterAssigned ? 'bg-blue-600' : 'bg-gray-200 dark:bg-neutral-700'} 
                        `}
                      >
                        <motion.span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${filterAssigned ? 'translate-x-6' : 'translate-x-1'}
                          `}
                          aria-hidden="true"
                        />
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Solo usuarios asignados</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                      {filteredUsers.map(user => (
                          <div key={user.user_id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-neutral-900 rounded-md">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.email}</span>
                              <button
                                type="button"
                                onClick={() => handleSwitchChange(user.user_id, !selectedUserIds.includes(user.user_id))}
                                className={`
                                  relative inline-flex items-center h-6 rounded-full w-11 transition-colors
                                  ${selectedUserIds.includes(user.user_id) ? 'bg-blue-600' : 'bg-gray-200 dark:bg-neutral-700'}
                                `}
                              >
                                <span className="sr-only">Asignar a {user.email}</span>
                                <motion.span
                                  className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                    ${selectedUserIds.includes(user.user_id) ? 'translate-x-6' : 'translate-x-1'}
                                  `}
                                  aria-hidden="true"
                                />
                              </button>
                          </div>
                      ))}
                      {filteredUsers.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No se encontraron usuarios.</p>
                      )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="dark:bg-transparent dark:text-gray-300 dark:border-neutral-600 dark:hover:bg-neutral-800"
                    >
                        Salir
                    </Button>
                    <Button 
                        onClick={handleUpdate} 
                        disabled={saving || !hasChanges}
                        className="dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white"
                    >
                        <span className="inline">Actualizar</span>
                    </Button>
                  </div>
                </motion.div>
            )}
            </AnimatePresence>
            {!selectedProgram && (
                <div className="flex justify-end pt-4">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="dark:bg-transparent dark:text-gray-300 dark:border-neutral-600 dark:hover:bg-neutral-800"
                    >
                        Salir
                    </Button>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}