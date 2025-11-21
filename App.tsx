import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import TaskBoard from './components/TaskBoard';
import LiveSessionComponent from './components/LiveSession';
import { Tab, User, UserRole } from './types';

const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Alex Morgan', 
    email: 'alex@texweave.com',
    avatar: 'https://ui-avatars.com/api/?name=Alex+Morgan&background=0D8ABC&color=fff', 
    role: UserRole.ADMIN 
  },
  { 
    id: 'u2', 
    name: 'Sarah Connor', 
    email: 'sarah@texweave.com',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=EB4D4B&color=fff', 
    role: UserRole.MEMBER 
  },
  { 
    id: 'u3', 
    name: 'John Doe', 
    email: 'john@guest.com',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=F0932B&color=fff', 
    role: UserRole.GUEST 
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  
  // Centralized User State for Permission Management
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);

  const handleAddUser = (newUser: User) => {
    setUsers([...users, newUser]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.CHAT:
        return <ChatArea currentUser={currentUser} users={users} />;
      case Tab.TASKS:
        return <TaskBoard currentUser={currentUser} users={users} />;
      case Tab.LIVE:
        return <LiveSessionComponent />;
      default:
        return <ChatArea currentUser={currentUser} users={users} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={users}
        onAddUser={handleAddUser}
      />
      
      <main className="flex-1 h-full relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;