import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Phone, MapPin, MessageCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Database } from '../lib/database.types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type Pet = Database['public']['Tables']['pets']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Coordinates = { lat: number; lng: number };

export default function PetPublic() {
  const { id } = useParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    fetchPetAndOwner();
    getUserLocation();
  }, [id]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLocationError('Não foi possível obter sua localização atual.');
        }
      );
    } else {
      setLocationError('Seu navegador não suporta geolocalização.');
    }
  };

  const fetchPetAndOwner = async () => {
    try {
      setLoading(true);
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .single();

      if (petError) throw petError;
      
      if (pet) {
        setPet(pet);
        
        const { data: owner, error: ownerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', pet.user_id)
          .single();

        if (ownerError) throw ownerError;
        setOwner(owner);
      }
    } catch (err: any) {
      console.error('Erro ao carregar informações:', err);
      setError('Não foi possível carregar as informações do pet.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!owner || !userLocation) return;

    const phoneNumber = owner.telefone.replace(/\D/g, '');
    const locationLink = `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
    const message = encodeURIComponent(
      `Olá, encontrei seu pet ${pet?.nome}! Aqui está a minha localização atual: ${locationLink}`
    );
    
    window.open(`https://wa.me/55${phoneNumber}?text=${message}`, '_blank');
  };

  const nextPhoto = () => {
    if (pet?.fotos_urls) {
      setCurrentPhotoIndex((prev) => 
        prev === pet.fotos_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (pet?.fotos_urls) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? pet.fotos_urls.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pet || !owner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <p className="text-center text-gray-600">
            {error || 'Pet não encontrado'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Fotos do Pet */}
          <div className="relative">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={pet.fotos_urls[currentPhotoIndex]}
                alt={`Foto ${currentPhotoIndex + 1} do ${pet.nome}`}
                className="w-full h-64 object-cover"
              />
            </div>
            {pet.fotos_urls.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md hover:bg-white"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md hover:bg-white"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </>
            )}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {pet.fotos_urls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{pet.nome}</h1>

            {/* Status do Pet */}
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Pet Perdido
              </span>
            </div>

            {/* Informações do Pet */}
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Espécie</p>
                  <p className="font-medium capitalize">{pet.especie}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Raça</p>
                  <p className="font-medium">{pet.raca}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Idade</p>
                  <p className="font-medium">{pet.idade} {pet.idade === 1 ? 'ano' : 'anos'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sexo</p>
                  <p className="font-medium capitalize">{pet.sexo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cor</p>
                  <p className="font-medium">{pet.cor}</p>
                </div>
              </div>
              {pet.informacoes && (
                <div>
                  <p className="text-sm text-gray-500">Informações Adicionais</p>
                  <p className="mt-1">{pet.informacoes}</p>
                </div>
              )}
            </div>

            {/* Mapa com Localização */}
            {userLocation && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Sua Localização Atual</h2>
                <div className="h-64 rounded-lg overflow-hidden">
                  <MapContainer
                    center={[userLocation.lat, userLocation.lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>
                        Você está aqui
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                {locationError && (
                  <p className="mt-2 text-sm text-red-600">{locationError}</p>
                )}
              </div>
            )}

            {/* Informações do Responsável e Botão de Contato */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Informações para Contato</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-purple-600 mr-2" />
                  <p>{owner.telefone}</p>
                </div>
                {owner.endereco && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-purple-600 mr-2" />
                    <p>{owner.endereco}</p>
                  </div>
                )}
                
                <button
                  onClick={handleWhatsAppContact}
                  disabled={!userLocation}
                  className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {userLocation 
                    ? 'Entrar em Contato pelo WhatsApp'
                    : 'Ative sua localização para entrar em contato'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}