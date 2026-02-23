import Sidebar from '../components/chat/Sidebar';
import ChatInterface from '../components/chat/ChatInterface';

export default function Chat() {
  return (
    // Full height minus navbar (64px) and footer
    <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px - 61px)' }}>
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      {/* Chat area */}
      <ChatInterface />
    </div>
  );
}
