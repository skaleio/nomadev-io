import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRel } from './KPI';

interface ChatMessage {
  id: string;
  sender: 'client' | 'agent' | 'bot';
  text: string;
  time: number;
}

interface ChatThread {
  id: string;
  customer: string;
  initials: string;
  gradient: string;
  status: 'active' | 'pending' | 'closed';
  unread: number;
  lastMessage: string;
  lastTime: number;
  channel: 'WhatsApp' | 'Instagram' | 'Web';
  messages: ChatMessage[];
}

const CHAT_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
];

const formatChat = (ts: number) => {
  const diff = Math.max(0, Date.now() - ts);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
};

const buildInitialChats = (): ChatThread[] => [
  {
    id: 'chat-1',
    customer: 'María González',
    initials: 'MG',
    gradient: CHAT_GRADIENTS[0],
    status: 'active',
    unread: 0,
    channel: 'WhatsApp',
    lastMessage: 'Perfecto, confirmo la dirección 👍',
    lastTime: Date.now() - 30_000,
    messages: [
      { id: 'm1', sender: 'bot', text: 'Hola María, te escribimos de Boutique Aurora 🌸 ¿Podemos confirmar tu pedido #NMD-21034?', time: Date.now() - 180_000 },
      { id: 'm2', sender: 'client', text: 'Hola! Sí dale', time: Date.now() - 150_000 },
      { id: 'm3', sender: 'bot', text: 'Tu pedido es: 1x Polera Oversize talla M, color blanco. Total $34.990. ¿Confirmas?', time: Date.now() - 120_000 },
      { id: 'm4', sender: 'client', text: 'Sí confirmo', time: Date.now() - 90_000 },
      { id: 'm5', sender: 'bot', text: 'Genial. Despacho a Av. Apoquindo 4250, Las Condes. ¿Correcto?', time: Date.now() - 60_000 },
      { id: 'm6', sender: 'client', text: 'Perfecto, confirmo la dirección 👍', time: Date.now() - 30_000 },
    ],
  },
  {
    id: 'chat-2',
    customer: 'Carlos Ruiz',
    initials: 'CR',
    gradient: CHAT_GRADIENTS[1],
    status: 'pending',
    unread: 2,
    channel: 'WhatsApp',
    lastMessage: '¿Tienen otro color disponible?',
    lastTime: Date.now() - 75_000,
    messages: [
      { id: 'm1', sender: 'bot', text: 'Hola Carlos, confirmamos tu pedido #NMD-21035 de Zapatillas Running Pro talla 42 🏃', time: Date.now() - 200_000 },
      { id: 'm2', sender: 'client', text: 'Hola, una consulta', time: Date.now() - 150_000 },
      { id: 'm3', sender: 'client', text: '¿Tienen otro color disponible?', time: Date.now() - 75_000 },
    ],
  },
  {
    id: 'chat-3',
    customer: 'Sofía López',
    initials: 'SL',
    gradient: CHAT_GRADIENTS[2],
    status: 'closed',
    unread: 0,
    channel: 'Instagram',
    lastMessage: 'Gracias, recibí todo perfecto ✨',
    lastTime: Date.now() - 8 * 60 * 1000,
    messages: [
      { id: 'm1', sender: 'bot', text: 'Hola Sofía, te escribimos por tu pedido #NMD-21002 ✨', time: Date.now() - 10 * 60 * 1000 },
      { id: 'm2', sender: 'client', text: 'Gracias, recibí todo perfecto ✨', time: Date.now() - 8 * 60 * 1000 },
    ],
  },
];

export const ChatSimulation: React.FC = () => {
  const [chats, setChats] = useState<ChatThread[]>(() => buildInitialChats());
  const [selectedId, setSelectedId] = useState<string>('chat-1');
  const [typingFor, setTypingFor] = useState<string | null>(null);
  const counterRef = useRef(100);

  const selected = chats.find((c) => c.id === selectedId) ?? chats[0];

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((v) => v + 1), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setChats((prev) => {
        const target = prev.find((c) => c.id === 'chat-2');
        if (!target) return prev;
        if (target.messages.length > 8) return prev;

        const lastMsg = target.messages[target.messages.length - 1];
        let nextMsg: ChatMessage | null = null;
        if (lastMsg.sender === 'client') {
          setTypingFor(target.id);
          setTimeout(() => setTypingFor(null), 1800);
          nextMsg = {
            id: `m-${++counterRef.current}`,
            sender: 'bot',
            text: 'Sí, también lo tenemos en negro y azul marino. ¿Cuál prefieres?',
            time: Date.now() + 1800,
          };
        } else if (lastMsg.sender === 'bot' && target.messages.length < 6) {
          nextMsg = {
            id: `m-${++counterRef.current}`,
            sender: 'client',
            text: 'Negro está bien, gracias!',
            time: Date.now(),
          };
        }

        if (!nextMsg) return prev;
        const finalMsg = nextMsg;

        setTimeout(() => {
          setChats((curr) =>
            curr.map((c) =>
              c.id === target.id
                ? {
                    ...c,
                    messages: [...c.messages, finalMsg],
                    lastMessage: finalMsg.text,
                    lastTime: Date.now(),
                    unread: finalMsg.sender !== 'client' ? c.unread : c.unread + 1,
                  }
                : c,
            ),
          );
        }, finalMsg.sender === 'bot' ? 2000 : 0);

        return prev;
      });
    }, 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Chat en Vivo</h1>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Demo en vivo
          </Badge>
        </div>
        <p className="text-gray-400">Bot WhatsApp + Instagram que valida pedidos automáticamente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[560px]">
        <Card className="bg-gray-900/50 border-gray-700 overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-800">
            <CardTitle className="text-white text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Conversaciones
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-0">{chats.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto h-[calc(100%-65px)]">
            {chats.map((chat) => {
              const isSelected = chat.id === selectedId;
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedId(chat.id);
                    setChats((p) => p.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-gray-800/60 transition-colors',
                    isSelected ? 'bg-emerald-500/10' : 'hover:bg-gray-800/40',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${chat.gradient} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                      {chat.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white text-sm font-medium truncate">{chat.customer}</span>
                        <span className="text-gray-500 text-xs flex-shrink-0">{formatChat(chat.lastTime)}</span>
                      </div>
                      <p className="text-gray-400 text-xs truncate mt-0.5">{chat.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          {chat.channel === 'WhatsApp' ? '🟢' : chat.channel === 'Instagram' ? '🟣' : '🔵'} {chat.channel}
                        </span>
                        {chat.unread > 0 && (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700 overflow-hidden lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${selected.gradient} flex items-center justify-center text-white font-bold text-xs`}>
                  {selected.initials}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{selected.customer}</p>
                  <p className="text-emerald-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> En línea · {selected.channel}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-0">Bot activo</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-900/20 to-gray-950/40">
            {selected.messages.map((msg) => {
              const isClient = msg.sender === 'client';
              return (
                <div key={msg.id} className={cn('flex', isClient ? 'justify-start' : 'justify-end')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                      isClient
                        ? 'bg-gray-800 text-white rounded-bl-sm'
                        : 'bg-emerald-600 text-white rounded-br-sm',
                    )}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <p className={cn('text-[10px] mt-1', isClient ? 'text-gray-400' : 'text-emerald-100/70')}>
                      {formatChat(msg.time)}
                    </p>
                  </div>
                </div>
              );
            })}
            {typingFor === selected.id && (
              <div className="flex justify-end">
                <div className="bg-emerald-600/70 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            )}
          </CardContent>
          <div className="border-t border-gray-800 px-4 py-3 flex items-center gap-2 bg-gray-900/60 flex-shrink-0">
            <div className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-gray-400 text-sm">
              El bot responde automáticamente…
            </div>
            <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-4">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatSimulation;
