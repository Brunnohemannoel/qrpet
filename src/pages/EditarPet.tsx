import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Camera, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Pet = Database['public']['Tables']['pets']['Row'];

export default function EditarPet() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<Pet>>({
    nome: '',
    especie: '',
    raca: '',
    idade: 0,
    sexo: '',
    cor: '',
    fotos_urls: [],
    informacoes: '',
    status: 'found'
  });

  useEffect(() => {
    fetchPet();
  }, [id]);

  const fetchPet = async () => {
    try {
      const { data: pet, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (pet) {
        setFormData({
          ...pet,
          fotos_urls: pet.fotos_urls || []
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar pet:', err);
      setError('Não foi possível carregar as informações do pet.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (formData.fotos_urls && formData.fotos_urls.length >= 4) {
        throw new Error('Máximo de 4 fotos permitido');
      }

      setUploadingPhoto(true);
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `pet-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pets')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        fotos_urls: [...(prev.fotos_urls || []), publicUrl]
      }));
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload da foto do pet.');
      console.error('Erro upload:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos_urls: prev.fotos_urls?.filter((_, i) => i !== index) || []
    }));
  };

  const nextPhoto = () => {
    if (formData.fotos_urls) {
      setCurrentPhotoIndex((prev) => 
        prev === formData.fotos_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (formData.fotos_urls) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? formData.fotos_urls!.length - 1 : prev - 1
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.nome || !formData.especie || !formData.raca || !formData.idade || !formData.sexo || !formData.cor) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      if (!formData.fotos_urls || formData.fotos_urls.length === 0) {
        throw new Error('Adicione pelo menos uma foto do pet');
      }

      const { error } = await supabase
        .from('pets')
        .update({
          ...formData,
          foto_url: formData.fotos_urls[0], // Primeira foto como principal
          idade: Number(formData.idade),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro ao atualizar pet:', err);
      setError(err.message || 'Não foi possível atualizar o pet. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-purple-600 hover:text-purple-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar para Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Pet</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fotos do Pet */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Fotos do Pet (máximo 4)
              </label>
              
              {/* Preview da foto atual */}
              {formData.fotos_urls && formData.fotos_urls.length > 0 && (
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={formData.fotos_urls[currentPhotoIndex]}
                    alt={`Foto ${currentPhotoIndex + 1} do pet`}
                    className="w-full h-full object-cover"
                  />
                  {formData.fotos_urls.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md hover:bg-white"
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-800" />
                      </button>
                      <button
                        type="button"
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md hover:bg-white"
                      >
                        <ChevronRight className="h-6 w-6 text-gray-800" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Miniaturas e gerenciamento de fotos */}
              <div className="grid grid-cols-4 gap-4">
                {formData.fotos_urls?.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Miniatura ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {(!formData.fotos_urls || formData.fotos_urls.length < 4) && (
                  <label className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <span className="mt-1 text-sm text-gray-500">Adicionar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                )}
              </div>
              {uploadingPhoto && (
                <p className="text-sm text-purple-600">Enviando foto...</p>
              )}
              <p className="text-sm text-gray-500">
                Tamanho máximo: 5MB por foto. Formatos: JPG, PNG
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Pet *</label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Espécie *</label>
                <select
                  name="especie"
                  required
                  value={formData.especie}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Selecione</option>
                  <option value="cachorro">Cachorro</option>
                  <option value="gato">Gato</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Raça *</label>
                <input
                  type="text"
                  name="raca"
                  required
                  value={formData.raca}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Idade (anos) *</label>
                <input
                  type="number"
                  name="idade"
                  required
                  min="0"
                  value={formData.idade}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sexo *</label>
                <select
                  name="sexo"
                  required
                  value={formData.sexo}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Selecione</option>
                  <option value="macho">Macho</option>
                  <option value="femea">Fêmea</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cor *</label>
                <input
                  type="text"
                  name="cor"
                  required
                  value={formData.cor}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Informações Adicionais</label>
              <textarea
                name="informacoes"
                value={formData.informacoes || ''}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="Características especiais, comportamento, cuidados necessários, etc."
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}