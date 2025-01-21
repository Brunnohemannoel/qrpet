import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, User, Plus, Edit, QrCode, Camera, X, Upload, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Pet = Database['public']['Tables']['pets']['Row'];

interface PetCardProps {
  pet: Pet;
  onDelete: (id: string) => Promise<void>;
  onNavigate: (path: string) => void;
  isDeleting: boolean;
}

const PetCard = ({ pet, onDelete, onNavigate, isDeleting }: PetCardProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pet.fotos_urls) {
      setCurrentPhotoIndex((prev) => 
        prev === pet.fotos_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pet.fotos_urls) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? pet.fotos_urls.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Photo Section */}
      <div className="relative h-48">
        {pet.fotos_urls && pet.fotos_urls.length > 0 ? (
          <>
            <img
              src={pet.fotos_urls[currentPhotoIndex]}
              alt={pet.nome}
              className="w-full h-full object-cover"
            />
            {pet.fotos_urls.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-800" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5 text-gray-800" />
                </button>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {pet.fotos_urls.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Camera className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <button
          onClick={() => onDelete(pet.id)}
          disabled={isDeleting}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Info Section */}
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{pet.nome}</h3>
          <div className="flex items-center text-sm text-gray-600 space-x-2">
            <span className="capitalize">{pet.especie}</span>
            <span>•</span>
            <span>{pet.raca}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 space-x-2 mt-1">
            <span>{pet.idade} {pet.idade === 1 ? 'ano' : 'anos'}</span>
            <span>•</span>
            <span className="capitalize">{pet.sexo}</span>
            <span>•</span>
            <span>{pet.cor}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onNavigate(`/editar-pet/${pet.id}`)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </button>
          <button
            onClick={() => onNavigate(`/pet/${pet.id}`)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-purple-600 shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPets();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingProfile) {
        setShowProfileModal(true);
        const defaultProfile = {
          id: user?.id,
          nome: user?.email?.split('@')[0] || 'Usuário',
          telefone: '',
          endereco: '',
          foto_url: null
        };
        setProfile(defaultProfile as Profile);
        setEditedProfile(defaultProfile);
      } else {
        setProfile(existingProfile);
        setEditedProfile(existingProfile);
      }
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err.message);
      setError('Não foi possível carregar as informações do perfil.');
    }
  }

  async function fetchPets() {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar pets:', err.message);
      setError('Não foi possível carregar a lista de pets.');
    } finally {
      setLoading(false);
    }
  }

  const handleDeletePet = async (petId: string) => {
    try {
      setDeletingPetId(petId);
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) throw error;

      setPets(pets.filter(pet => pet.id !== petId));
    } catch (err: any) {
      console.error('Erro ao deletar pet:', err);
      setError('Não foi possível deletar o pet.');
    } finally {
      setDeletingPetId(null);
    }
  };

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploadingPhoto(true);
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setEditedProfile({ ...editedProfile, foto_url: publicUrl });
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      setProfile({ ...profile, foto_url: publicUrl } as Profile);
    } catch (err: any) {
      console.error('Erro ao fazer upload da foto:', err.message);
      setError('Não foi possível fazer upload da foto.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleProfileUpdate() {
    try {
      if (!editedProfile.nome || !editedProfile.telefone) {
        setError('Nome e telefone são obrigatórios.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...editedProfile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setProfile({ ...profile, ...editedProfile } as Profile);
      setIsEditingProfile(false);
      setShowProfileModal(false);
      setError('');
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err.message);
      setError('Não foi possível atualizar o perfil.');
    }
  }

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setError('Não foi possível fazer logout. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white flex items-center justify-center">
        <div className="text-purple-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white">
      {/* Modal de Perfil */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Complete seu Perfil</h2>
              {!profile?.nome && !profile?.telefone ? null : (
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Foto de Perfil */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {editedProfile.foto_url ? (
                      <img
                        src={editedProfile.foto_url}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="photo-upload-modal"
                    className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2 cursor-pointer hover:bg-purple-700"
                  >
                    <Upload className="h-4 w-4 text-white" />
                  </label>
                  <input
                    id="photo-upload-modal"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </div>
                {uploadingPhoto && (
                  <p className="text-sm text-gray-500 mt-2">Enviando foto...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                <input
                  type="text"
                  value={editedProfile.nome || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, nome: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone *</label>
                <input
                  type="tel"
                  value={editedProfile.telefone || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, telefone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <input
                  type="text"
                  value={editedProfile.endereco || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, endereco: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={handleProfileUpdate}
                className="w-full mt-6 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                disabled={uploadingPhoto}
              >
                Salvar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div 
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => setShowProfileModal(true)}
            >
              {profile?.foto_url ? (
                <img
                  src={profile.foto_url}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Perfil do Usuário */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <User className="h-6 w-6 mr-2" />
              Meu Perfil
            </h2>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditingProfile ? 'Cancelar' : 'Editar Perfil'}
            </button>
          </div>

          {isEditingProfile ? (
            <div className="space-y-4">
              {/* Foto de Perfil */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {editedProfile.foto_url ? (
                      <img
                        src={editedProfile.foto_url}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2 cursor-pointer hover:bg-purple-700"
                  >
                    <Upload className="h-4 w-4 text-white" />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </div>
                {uploadingPhoto && (
                  <p className="text-sm text-gray-500 mt-2">Enviando foto...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={editedProfile.nome || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, nome: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="tel"
                  value={editedProfile.telefone || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, telefone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <input
                  type="text"
                  value={editedProfile.endereco || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, endereco: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={handleProfileUpdate}
                className="w-full mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Salvar Alterações
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Foto de Perfil */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profile?.foto_url ? (
                    <img
                      src={profile.foto_url}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-purple-600 hover:text-purple-700 text-sm"
                >
                  Alterar foto
                </button>
              </div>
              <p className="text-gray-600">
                <span className="font-medium">Nome:</span> {profile?.nome || 'Não informado'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Telefone:</span> {profile?.telefone || 'Não informado'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Endereço:</span> {profile?.endereco || 'Não informado'}
              </p>
            </div>
          )}
        </div>

        {/* Seção de Pets */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Meus Pets</h2>
            <button
              onClick={() => navigate('/cadastrar-pet')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Cadastrar Pet
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pet cadastrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece cadastrando seu primeiro pet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onDelete={handleDeletePet}
                  onNavigate={navigate}
                  isDeleting={deletingPetId === pet.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}