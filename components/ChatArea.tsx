import React, { useState, useRef, useEffect } from 'react';
import { Message, User, Attachment, UserRole } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { blobToBase64 } from '../services/audioUtils';

const AI_USER: User = {
  id: 'ai-1',
  name: 'Gemini Assistant',
  avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png',
  role: UserRole.ADMIN, // AI effectively has full access
  isAi: true,
};

interface ChatAreaProps {
  currentUser: User;
  users: User[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ currentUser, users }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: 'ai-1',
      text: "Hello! I'm your AI team assistant. You can share PDFs, Excel sheets, or images here, and I'll help you analyze them.",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser.role === UserRole.GUEST) return; // Security check
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const base64 = await blobToBase64(file);
        const newAttachment: Attachment = {
          name: file.name,
          type: file.type,
          data: base64,
          mimeType: file.type,
        };
        setAttachments([...attachments, newAttachment]);
      } catch (err) {
        console.error("File upload error", err);
      }
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isProcessing) return;

    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      userId: currentUser.id,
      text: inputText,
      timestamp: new Date(),
      attachments: [...attachments],
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachments([]);
    setIsProcessing(true);

    // Simulate AI thinking time briefly
    setTimeout(async () => {
      const responseText = await sendMessageToGemini(messages, userMessage.text, userMessage.attachments);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        userId: AI_USER.id,
        text: responseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 600);
  };

  const getIconForType = (mimeType: string) => {
    if (mimeType.includes('image')) return 'fa-file-image text-purple-500';
    if (mimeType.includes('pdf')) return 'fa-file-pdf text-red-500';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'fa-file-excel text-green-500';
    return 'fa-file text-slate-500';
  };

  const canUpload = currentUser.role !== UserRole.GUEST;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Team General</h2>
          <p className="text-xs text-slate-500">{users.length} members, 1 online (AI)</p>
        </div>
        <div className="flex items-center gap-4">
          {currentUser.role === UserRole.GUEST && (
             <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200">
               <i className="fa-solid fa-shield-halved mr-1"></i>
               Read-only Guest Mode
             </span>
          )}
          <div className="flex items-center gap-2 text-slate-400">
            <i className="fa-solid fa-lock text-xs"></i>
            <span className="text-xs">End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => {
          const isMe = msg.userId === currentUser.id;
          // Try to find user in the users list, fallback to AI or Guest if not found immediately
          const user = isMe ? currentUser : (users.find(u => u.id === msg.userId) || AI_USER);
          
          return (
            <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
              
              <div className={`max-w-[70%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2">
                   <span className="text-sm font-medium text-slate-700">{user.name}</span>
                   <span className="text-xs text-slate-400">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                <div className={`p-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}>
                  {/* Attachments Rendering */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map((att, idx) => (
                        <div key={idx} className={`flex items-center gap-2 p-2 rounded ${isMe ? 'bg-blue-700/50' : 'bg-slate-100'} max-w-full`}>
                          <i className={`fa-solid ${getIconForType(att.mimeType)} text-lg`}></i>
                          <div className="overflow-hidden">
                            <p className="truncate text-xs font-medium">{att.name}</p>
                            <p className="text-[10px] opacity-70 uppercase">{att.type.split('/')[1]}</p>
                          </div>
                          {att.mimeType.startsWith('image/') && (
                            <img src={`data:${att.mimeType};base64,${att.data}`} className="w-10 h-10 object-cover rounded ml-2" alt="preview" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {isProcessing && (
          <div className="flex gap-4">
             <img src={AI_USER.avatar} className="w-10 h-10 rounded-full bg-slate-200" alt="AI" />
             <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto py-2">
             {attachments.map((att, i) => (
               <div key={i} className="relative bg-slate-100 p-2 rounded border border-slate-200 group">
                 <button 
                   onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                   className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <i className="fa-solid fa-times"></i>
                 </button>
                 <div className="flex items-center gap-2 text-xs text-slate-600">
                   <i className={`fa-solid ${getIconForType(att.mimeType)}`}></i>
                   <span className="max-w-[100px] truncate">{att.name}</span>
                 </div>
               </div>
             ))}
          </div>
        )}

        <div className="flex items-end gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*,.pdf,.csv,.xlsx,.txt" 
          />
          
          <button 
            onClick={() => canUpload && fileInputRef.current?.click()}
            disabled={!canUpload}
            className={`w-10 h-10 mb-1 rounded-full transition-colors flex items-center justify-center
              ${canUpload 
                ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50' 
                : 'text-slate-300 cursor-not-allowed opacity-50'}`}
            title={canUpload ? "Attach file" : "Guests cannot attach files"}
          >
            <i className="fa-solid fa-paperclip text-lg"></i>
          </button>
          
          <div className="flex-1 bg-slate-100 rounded-2xl flex items-center p-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={canUpload ? "Type a message..." : "Type a message (attachments disabled)..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 text-sm px-2 resize-none max-h-32"
              rows={1}
              style={{ minHeight: '24px' }}
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={!inputText.trim() && attachments.length === 0}
            className={`w-10 h-10 mb-1 rounded-full flex items-center justify-center transition-colors shadow-sm
              ${(!inputText.trim() && attachments.length === 0) 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;