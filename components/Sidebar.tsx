import React, { useState } from 'react';
import { Tab, User, UserRole } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  onAddUser: (user: User) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  setCurrentUser,
  users,
  onAddUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.MEMBER);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const menuItems = [
    { id: Tab.CHAT, label: 'TexWeave Chat', icon: 'fa-comments' },
    { id: Tab.TASKS, label: 'Task Tracker', icon: 'fa-list-check' },
    { id: Tab.LIVE, label: 'Live Video', icon: 'fa-video' },
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-purple-500 text-white';
      case UserRole.MEMBER: return 'bg-blue-500 text-white';
      case UserRole.GUEST: return 'bg-slate-500 text-white';
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    // Create the mock user immediately for demo purposes
    const newUser: User = {
      id: Date.now().toString(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(inviteName)}&background=random`
    };

    onAddUser(newUser);
    
    // Generate a fake invite link
    const token = Math.random().toString(36).substring(2, 15);
    setInviteLink(`https://texweave.app/join?token=${token}`);
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const resetModal = () => {
    setInviteEmail('');
    setInviteName('');
    setInviteRole(UserRole.MEMBER);
    setInviteLink(null);
    setIsModalOpen(false);
  };

  const canAddMembers = currentUser.role === UserRole.ADMIN;

  return (
    <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-full transition-all duration-300 relative z-20">
      <div className="p-6 flex items-center justify-center md:justify-start gap-3 border-b border-slate-800">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg">
          <i className="fa-solid fa-layer-group text-xl"></i>
        </div>
        <span className="font-bold text-xl hidden md:block tracking-tight">TexWeave</span>
      </div>

      <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-3 transition-colors relative
              ${activeTab === item.id ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md"></div>
            )}
            <i className={`fa-solid ${item.icon} text-lg w-6 text-center`}></i>
            <span className="font-medium hidden md:block">{item.label}</span>
          </button>
        ))}

        {/* Team Section */}
        <div className="pt-6 pb-2 px-6 hidden md:block">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Members</p>
            {canAddMembers && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 hover:bg-blue-600 transition-colors text-xs border border-slate-700"
                title="Invite New Member"
              >
                <i className="fa-solid fa-user-plus"></i>
              </button>
            )}
          </div>
          <div className="space-y-3">
            {users.map(user => (
              <div 
                key={user.id} 
                onClick={() => setCurrentUser(user)}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded transition-colors group ${currentUser.id === user.id ? 'bg-slate-800 ring-1 ring-blue-500/50' : 'hover:bg-slate-800/50'}`}
              >
                <div className="relative">
                   <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-slate-700 object-cover border border-slate-600 group-hover:border-slate-500" />
                   {currentUser.id === user.id && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>}
                </div>
                <div className="overflow-hidden">
                  <p className={`text-sm font-medium truncate ${currentUser.id === user.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{user.name}</p>
                  <p className="text-[10px] text-slate-600 truncate capitalize group-hover:text-slate-500">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
          <img 
            src={currentUser.avatar}
            alt="Profile" 
            className="w-8 h-8 rounded-full border border-slate-600"
          />
          <div className="hidden md:block overflow-hidden flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${getRoleBadgeColor(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <i className="fa-solid fa-envelope-open-text text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Invite to Team</h3>
                  <p className="text-xs text-slate-500">Send an invitation to join TexWeave</p>
                </div>
              </div>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-times text-lg"></i>
              </button>
            </div>

            {!inviteLink ? (
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <i className="fa-regular fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="email" 
                      required
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-10 p-2 border border-slate-300 rounded focus:outline-blue-500 focus:ring-2 focus:ring-blue-200 transition-shadow"
                      placeholder="colleague@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={inviteName} 
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 focus:ring-2 focus:ring-blue-200 transition-shadow"
                    placeholder="e.g. Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role Permission</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(UserRole).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`text-xs py-2.5 px-1 rounded border transition-all flex flex-col items-center gap-1
                          ${inviteRole === role ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-white'}`}
                      >
                        <span className="font-semibold">{role}</span>
                        <span className={`text-[9px] opacity-80 ${inviteRole === role ? 'text-blue-100' : 'text-slate-400'}`}>
                          {role === 'Admin' ? 'Full Access' : role === 'Member' ? 'Edit Access' : 'Read Only'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button 
                    type="button" 
                    onClick={resetModal}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-lg shadow-blue-200"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <i className="fa-solid fa-check text-2xl"></i>
                </div>
                <h4 className="text-lg font-bold text-slate-800">Invitation Sent!</h4>
                <p className="text-sm text-slate-500">
                  We've sent an email to <strong>{inviteEmail}</strong>.<br/>
                  You can also share this link directly:
                </p>
                
                <div className="flex gap-2 mt-4">
                  <input 
                    readOnly
                    value={inviteLink}
                    className="flex-1 bg-slate-100 border border-slate-300 rounded px-3 text-sm text-slate-600 focus:outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2
                      ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                  >
                    <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-copy'}`}></i>
                    {isCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                
                <div className="pt-6">
                  <button 
                    onClick={resetModal}
                    className="text-blue-600 text-sm hover:underline font-medium"
                  >
                    Done, invite another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;