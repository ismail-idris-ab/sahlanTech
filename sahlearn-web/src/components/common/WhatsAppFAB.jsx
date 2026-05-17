import { MessageCircle } from 'lucide-react';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

export default function WhatsAppFAB({ message = "Hi Sahlearn, I'd like to get in touch." }) {
  const link = `https://wa.me/${WA_NUM}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
    >
      <MessageCircle size={26} />
    </a>
  );
}
