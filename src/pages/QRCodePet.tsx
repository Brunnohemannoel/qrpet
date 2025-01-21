import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Pet = Database['public']['Tables']['pets']['Row'];

export default function QRCodePet() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [publicUrl, setPublicUrl] = useState('');

  useEffect(() => {
    fetchPet();
  }, [id]);

  useEffect(() => {
    if (pet) {
      // Generate the public URL for the pet using relative path
      const petPublicUrl = `/pet/public/${id}`;
      setPublicUrl(petPublicUrl);
      
      // Generate QR code using QR Server API with absolute URL
      const absoluteUrl = `${window.location.protocol}//${window.location.host}${petPublicUrl}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(absoluteUrl)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [pet, id]);

  const fetchPet = async () => {
    try {
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .single();

      if (petError) throw petError;
      if (pet) {
        setPet(pet);
      }
    } catch (err: any) {
      console.error('Erro ao carregar informações:', err);
      setError('Não foi possível carregar as informações do pet.');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${pet?.nome || 'pet'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Erro ao baixar o QR Code');
    }
  };

  const handleShare = async () => {
    try {
      const absoluteUrl = `${window.location.protocol}//${window.location.host}${publicUrl}`;
      if (navigator.share) {
        await navigator.share({
          title: `QR Code do ${pet?.nome}`,
          text: `Escaneie este QR Code para ver as informações do ${pet?.nome}`,
          url: absoluteUrl
        });
      } else {
        await navigator.clipboard.writeText(absoluteUrl);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-center text-gray-600">
              {error || 'Carregando...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 mb-8">QR Code do {pet.nome}</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center space-y-8">
            {/* QR Code Section */}
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
              {qrCodeUrl && (
                <div className="relative aspect-square">
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code do ${pet.nome}`}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>

            {/* URL Section */}
            <div className="w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">URL Pública do Pet:</h2>
              <div className="bg-gray-50 p-3 rounded-lg break-all text-sm text-gray-600">
                {`${window.location.protocol}//${window.location.host}${publicUrl}`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row w-full max-w-md gap-4">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Download QR Code
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Compartilhar
              </button>
            </div>

            {/* Instructions */}
            <div className="w-full max-w-md bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Como usar:</h3>
              <ol className="list-decimal list-inside text-blue-700 space-y-2">
                <li>Faça o download do QR Code</li>
                <li>Imprima e coloque na coleira do seu pet</li>
                <li>Compartilhe o link com amigos e familiares</li>
                <li>Qualquer pessoa que escanear o QR Code terá acesso às informações do seu pet</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}