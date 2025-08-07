'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

// Tipos
interface UserProfile {
  user_id: string;
  nombre: string;
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
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [availablePrograms, setAvailablePrograms] = useState<ProgramaEducativo[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramaEducativo[]>([]);
  const [programSearchTerm, setProgramSearchTerm] = useState('');
  const [programToAssign, setProgramToAssign] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedUser = allUsers.find(u => u.user_id === selectedUserId) || null;

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();
        try {
          const usersResponse = await fetch('/api/users/listar-por-modulo?modulo=EDUCACION');
          if (!usersResponse.ok) throw new Error('Error al cargar usuarios');
          const usersData = await usersResponse.json();
          const sortedUsers = (usersData || []).sort((a: UserProfile, b: UserProfile) => a.nombre.localeCompare(b.nombre));
          setAllUsers(sortedUsers);
          setFilteredUsers(sortedUsers);

          const { data: programsData, error: programsError } = await supabase
            .from('programas_educativos').select('id, nombre').is('parent_id', null);
          if (programsError) throw programsError;
          setAvailablePrograms(programsData || []);
          setFilteredPrograms(programsData || []);

        } catch (error) {
          toast.error('Error al cargar los datos iniciales.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  // Filtrar usuarios
  useEffect(() => {
    const filtered = allUsers.filter(user =>
      user.nombre.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [userSearchTerm, allUsers]);

  // Filtrar programas
  useEffect(() => {
    const filtered = availablePrograms.filter(program =>
      program.nombre.toLowerCase().includes(programSearchTerm.toLowerCase())
    );
    setFilteredPrograms(filtered);
  }, [programSearchTerm, availablePrograms]);

  const handleAddProgram = async () => {
    if (!selectedUser || !programToAssign) return;
    setSaving(true);
    const currentPrograms = selectedUser.programas_asignados || [];
    if (currentPrograms.includes(programToAssign)) {
      toast.warn('Este programa ya está asignado.');
      setSaving(false);
      return;
    }
    const updatedPrograms = [...currentPrograms, programToAssign].sort();
    const supabase = createClient();
    const { error } = await supabase
      .from('accesos_programas').insert({ user_id: selectedUser.user_id, programa: programToAssign });

    if (error) {
      toast.error('Error al asignar el programa.');
    } else {
      toast.success('Programa asignado.');
      const updatedUser = { ...selectedUser, programas_asignados: updatedPrograms };
      setAllUsers(allUsers.map(u => u.user_id === selectedUser.user_id ? updatedUser : u));
      setProgramToAssign('');
    }
    setSaving(false);
  };

  const handleRemoveProgram = async (programToRemove: string) => {
    if (!selectedUser) return;
    setSaving(true);
    const updatedPrograms = (selectedUser.programas_asignados || []).filter(p => p !== programToRemove);
    const supabase = createClient();
    const { error } = await supabase
      .from('accesos_programas').delete().eq('user_id', selectedUser.user_id).eq('programa', programToRemove);

    if (error) {
      toast.error('Error al quitar el programa.');
    } else {
      toast.warn('Programa quitado.');
      const updatedUser = { ...selectedUser, programas_asignados: updatedPrograms };
      setAllUsers(allUsers.map(u => u.user_id === selectedUser.user_id ? updatedUser : u));
    }
    setSaving(false);
  };

  const programsForDropdown = selectedUser 
    ? filteredPrograms.filter(p => !(selectedUser.programas_asignados || []).includes(p.nombre))
    : filteredPrograms;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <motion.div 
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" 
        initial={{ opacity: 0, y: -30 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Asignar Programas Educativos</h2>
              <p className="text-sm text-gray-500">Seleccione un usuario para gestionar sus programas.</p>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full -mt-2 -mr-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
            {/* Sección de Selección de Usuario */}
            <div className="p-6 bg-white rounded-lg border">
                <h3 className="font-semibold mb-2">1. Seleccione un Usuario</h3>
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Filtrar usuario por nombre..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Seleccionar --</option>
                    {filteredUsers.map(user => (
                        <option key={user.user_id} value={user.user_id}>{user.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Sección de Gestión de Programas */}
            <AnimatePresence>
            {selectedUser && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative p-6 bg-white rounded-lg border"
                >
                  {saving && <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-10 rounded-lg"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>}
                  <h3 className="text-lg font-semibold mb-4">2. Programas de: <span className="text-blue-600">{selectedUser.nombre}</span></h3>
                  
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {(selectedUser.programas_asignados && selectedUser.programas_asignados.length > 0) ? (
                      selectedUser.programas_asignados.map(programa => (
                        <div key={programa} className="flex items-center justify-between p-3 bg-slate-50 border rounded-md">
                          <span className="font-medium text-gray-700">{programa}</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={() => handleRemoveProgram(programa)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic mt-2">Este usuario no tiene programas asignados.</p>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Asignar nuevo programa</h4>
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Filtrar programa..."
                            value={programSearchTerm}
                            onChange={(e) => setProgramSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={programToAssign}
                            onChange={(e) => setProgramToAssign(e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Seleccionar...</option>
                            {programsForDropdown.map(p => (
                                <option key={p.id} value={p.nombre}>{p.nombre}</option>
                            ))}
                        </select>
                        <Button onClick={handleAddProgram} disabled={saving || !programToAssign}>
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Asignar</span>
                        </Button>
                    </div>
                  </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
