import { useState } from 'react';
import { Hash, FileText, MessageSquare, Plus, Send, ChevronRight, ChevronDown, X, Table, Columns3, Users, Search, Folder, Star, Home, Quote, Reply, Calendar, User, CheckSquare, AlignLeft } from 'lucide-react';

// Avatar
const Avatar = ({ initials, size = 'md', online }) => {
  const sizes = { xs: 'w-4 h-4 text-xs', sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm' };
  const colors = { AK: 'bg-purple-500', MJ: 'bg-teal-500', SR: 'bg-orange-500', JL: 'bg-pink-500' };
  return (
    <div className="relative inline-flex flex-shrink-0">
      <div className={`${sizes[size]} ${colors[initials] || 'bg-slate-400'} rounded-full flex items-center justify-center text-white font-medium`}>{size === 'xs' ? '' : initials}</div>
      {online !== undefined && <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? 'bg-green-500' : 'bg-slate-400'}`} />}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = { todo: 'bg-slate-100 text-slate-600', doing: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700' };
  const labels = { todo: 'To Do', doing: 'In Progress', done: 'Done' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status]}`}>{labels[status]}</span>;
};

const ItemIcon = ({ type }) => {
  if (type === 'list') return <Columns3 size={14} className="text-slate-400" />;
  if (type === 'doc') return <FileText size={14} className="text-slate-400" />;
  if (type === 'channel') return <Hash size={14} className="text-slate-400" />;
  return null;
};

// Message Component
const Message = ({ msg, onStartThread, onQuote, allMessages = [] }) => {
  const quotedContent = msg.quoteId ? allMessages.find(m => m.id === msg.quoteId) : null;
  return (
    <div className="group">
      {quotedContent && (
        <div className="flex items-center gap-2 ml-11 mb-1">
          <div className="w-4 h-4 border-l-2 border-t-2 border-slate-300 rounded-tl" />
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200">
            <Avatar initials={quotedContent.avatar} size="xs" />
            <span className="font-medium">{quotedContent.user}</span>
            <span className="truncate max-w-48">{quotedContent.text}</span>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <Avatar initials={msg.avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-800">{msg.user}</span>
            <span className="text-xs text-slate-400">{msg.time}</span>
          </div>
          <p className="text-slate-700 mt-0.5">{msg.text}</p>
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onQuote(msg)} className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 py-1 rounded flex items-center gap-1"><Quote size={12} /> Quote</button>
            <button onClick={() => onStartThread(msg)} className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 py-1 rounded flex items-center gap-1"><Reply size={12} /> Reply</button>
          </div>
          {msg.thread?.length > 0 && (
            <button onClick={() => onStartThread(msg)} className="flex items-center gap-2 mt-2 text-blue-600 text-sm hover:underline">
              <div className="flex -space-x-1">{[...new Set(msg.thread.map(t => t.avatar))].slice(0, 3).map((av, i) => <Avatar key={i} initials={av} size="xs" />)}</div>
              <span>{msg.thread.length} {msg.thread.length === 1 ? 'reply' : 'replies'}</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Thread Panel
const ThreadPanel = ({ parentMsg, onClose, allMessages }) => {
  const [replyText, setReplyText] = useState('');
  const [quoteTarget, setQuoteTarget] = useState(null);
  return (
    <div className="w-96 border-l border-slate-200 bg-white flex flex-col flex-shrink-0">
      <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4">
        <span className="font-semibold">Thread</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="pb-4 border-b border-slate-100">
          <Message msg={parentMsg} onStartThread={() => {}} onQuote={setQuoteTarget} allMessages={allMessages} />
        </div>
        {parentMsg.thread?.map(reply => {
          const quoted = reply.quoteId ? allMessages.find(m => m.id === reply.quoteId) : null;
          return (
            <div key={reply.id} className="group">
              {quoted && (
                <div className="flex items-center gap-2 ml-9 mb-1">
                  <div className="w-3 h-3 border-l-2 border-t-2 border-slate-300 rounded-tl" />
                  <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    <span className="font-medium">{quoted.user}</span>
                    <span className="truncate max-w-32">{quoted.text}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Avatar initials={reply.avatar} size="sm" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2"><span className="font-semibold text-sm">{reply.user}</span><span className="text-xs text-slate-400">{reply.time}</span></div>
                  <p className="text-slate-700 text-sm mt-0.5">{reply.text}</p>
                  <button onClick={() => setQuoteTarget(reply)} className="text-xs text-slate-400 hover:text-slate-600 mt-1 opacity-0 group-hover:opacity-100"><Quote size={12} className="inline mr-1" />Quote</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-slate-200">
        {quoteTarget && (
          <div className="flex items-center gap-2 mb-2 text-xs bg-slate-100 px-2 py-1.5 rounded">
            <Quote size={12} className="text-slate-400" />
            <span className="truncate flex-1">{quoteTarget.text?.slice(0, 40)}...</span>
            <button onClick={() => setQuoteTarget(null)}><X size={12} /></button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
          <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Reply..." className="flex-1 bg-transparent outline-none text-sm" />
          <button className="text-slate-400 hover:text-blue-600"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
};

// Task Detail Panel
const TaskDetailPanel = ({ task, onClose, onStartThread, allMessages }) => {
  const [openThread, setOpenThread] = useState(null);
  const flatComments = task.comments ? [...task.comments, ...task.comments.flatMap(c => c.thread || [])] : [];
  
  return (
    <div className="w-[480px] border-l border-slate-200 bg-white flex flex-col flex-shrink-0">
      <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4">
        <span className="font-semibold">Task Details</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{task.title}</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-500 flex items-center gap-2"><CheckSquare size={14} /> Status</div>
              <StatusBadge status={task.status} />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-500 flex items-center gap-2"><User size={14} /> Assigned</div>
              {task.assignee ? <div className="flex items-center gap-2"><Avatar initials={task.assignee} size="sm" /><span className="text-sm">{task.assigneeName}</span></div> : <span className="text-sm text-slate-400">Unassigned</span>}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-500 flex items-center gap-2"><Calendar size={14} /> Due on</div>
              <span className="text-sm">{task.dueOn || <span className="text-slate-400">No date</span>}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-500 flex items-center gap-2"><User size={14} /> Created by</div>
              <div className="flex items-center gap-2"><Avatar initials={task.createdBy} size="sm" /><span className="text-sm">{task.createdByName}</span><span className="text-xs text-slate-400">· {task.createdAt}</span></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm text-slate-500 flex items-center gap-2"><AlignLeft size={14} /> Notes</div>
              <p className="text-sm text-slate-700 flex-1">{task.notes || <span className="text-slate-400">No notes</span>}</p>
            </div>
          </div>
        </div>
        
        {/* Subtasks */}
        {task.subtasks && (
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-700">Subtasks</h3>
              <span className="text-xs text-slate-400">{task.subtasks.filter(s => s.status === 'done').length}/{task.subtasks.length}</span>
            </div>
            <div className="space-y-2">
              {task.subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${sub.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
                    {sub.status === 'done' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-sm flex-1 ${sub.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{sub.title}</span>
                  {sub.assignee && <Avatar initials={sub.assignee} size="xs" />}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Comments */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={14} className="text-slate-400" />
            <h3 className="font-medium text-slate-700">Comments</h3>
            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{task.comments?.length || 0}</span>
          </div>
          <div className="space-y-4">
            {task.comments?.map(comment => (
              <Message key={comment.id} msg={comment} onStartThread={setOpenThread} onQuote={() => {}} allMessages={flatComments} />
            ))}
          </div>
          <div className="mt-4 flex items-start gap-3">
            <Avatar initials="AK" size="sm" />
            <div className="flex-1">
              <textarea placeholder="Add a comment..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" rows={2} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Thread panel for task comments */}
      {openThread && (
        <div className="absolute right-0 top-0 h-full">
          <ThreadPanel parentMsg={openThread} onClose={() => setOpenThread(null)} allMessages={flatComments} />
        </div>
      )}
    </div>
  );
};

// Data
const initialData = {
  projects: [
    { id: 'mobile-v2', name: 'Mobile App v2', starred: true, items: [
      { type: 'list', id: 'l1', name: 'Sprint Board' },
      { type: 'doc', id: 'c1', name: 'Product Spec' },
      { type: 'channel', id: 'ch1', name: 'mobile-dev' },
    ]},
    { id: 'platform', name: 'Platform Redesign', starred: false, items: [
      { type: 'list', id: 'l2', name: 'Tasks' },
      { type: 'doc', id: 'c3', name: 'Architecture RFC' },
    ]},
  ],
  lists: [
    { id: 'sl1', name: 'Bug Triage', starred: true },
    { id: 'sl2', name: 'Backlog', starred: false },
  ],
  docs: [
    { id: 'sc1', name: 'Meeting Notes', starred: false },
    { id: 'sc2', name: 'Onboarding Guide', starred: true },
  ],
  channels: [
    { id: 'sch1', name: 'general', starred: true },
    { id: 'sch2', name: 'random', starred: false },
    { id: 'sch3', name: 'announcements', starred: false },
  ],
  dms: [
    { id: 'dm1', name: 'Maya Jones', avatar: 'MJ', online: true, starred: true },
    { id: 'dm2', name: 'Sam Rivera', avatar: 'SR', online: false, starred: false },
  ],
};

const listItemsData = {
  l1: [
    { id: 't1', title: 'Auth flow redesign', status: 'done', assignee: 'AK', assigneeName: 'Alex Kim', createdBy: 'AK', createdByName: 'Alex Kim', createdAt: 'Jan 15', dueOn: 'Jan 20', notes: 'Implement new SSO flow with token refresh.', 
      subtasks: [
        { id: 's1', title: 'Design login screens', status: 'done', assignee: 'MJ', assigneeName: 'Maya Jones', createdBy: 'AK', createdByName: 'Alex Kim', createdAt: 'Jan 15', notes: 'Follow the new brand guidelines for colors and typography.', comments: [
          { id: 'sc1', user: 'Maya Jones', avatar: 'MJ', text: 'Uploaded first draft to Figma. Let me know if the SSO button placement works.', time: 'Jan 16', thread: [
            { id: 'sc1r1', user: 'Alex Kim', avatar: 'AK', text: 'Looks great! Can we make the SSO button more prominent?', time: 'Jan 16' },
            { id: 'sc1r2', user: 'Maya Jones', avatar: 'MJ', text: 'Done, updated the design.', time: 'Jan 17' },
          ]},
        ]},
        { id: 's2', title: 'Implement OAuth', status: 'done', assignee: 'AK', assigneeName: 'Alex Kim', createdBy: 'AK', createdByName: 'Alex Kim', createdAt: 'Jan 15', notes: null, comments: [] },
        { id: 's3', title: 'Add token refresh', status: 'done', assignee: 'AK', assigneeName: 'Alex Kim', createdBy: 'MJ', createdByName: 'Maya Jones', createdAt: 'Jan 17', notes: 'Handle edge case when refresh token expires during active session.', comments: [] },
      ],
      comments: [
        { id: 'tc1', user: 'Maya Jones', avatar: 'MJ', text: 'Designs are uploaded to Figma.', time: '2 days ago', thread: [] },
        { id: 'tc2', user: 'Sam Rivera', avatar: 'SR', text: 'OAuth implementation looks solid!', time: '1 day ago', quoteId: 'tc1', thread: [] },
      ]
    },
    { id: 't2', title: 'Push notifications', status: 'doing', assignee: 'MJ', assigneeName: 'Maya Jones', createdBy: 'AK', createdByName: 'Alex Kim', createdAt: 'Jan 18', dueOn: 'Jan 28', notes: 'Setup FCM for Android and APNs for iOS.',
      subtasks: [
        { id: 's4', title: 'FCM integration', status: 'done', assignee: 'MJ', assigneeName: 'Maya Jones', createdBy: 'MJ', createdByName: 'Maya Jones', createdAt: 'Jan 18', notes: null, comments: [] },
        { id: 's5', title: 'APNs integration', status: 'doing', assignee: 'MJ', assigneeName: 'Maya Jones', createdBy: 'MJ', createdByName: 'Maya Jones', createdAt: 'Jan 18', notes: 'Need to set up certificates in Apple Developer portal first.', comments: [
          { id: 'sc2', user: 'Alex Kim', avatar: 'AK', text: 'I can help with the cert setup if needed.', time: '2 hours ago', thread: [] },
        ]},
        { id: 's6', title: 'Notification preferences UI', status: 'todo', assignee: null, assigneeName: null, createdBy: 'AK', createdByName: 'Alex Kim', createdAt: 'Jan 20', notes: null, comments: [] },
      ],
      comments: [
        { id: 'tc3', user: 'Maya Jones', avatar: 'MJ', text: 'FCM is done. Working on APNs now.', time: '3 hours ago', thread: [
          { id: 'tc3r1', user: 'Alex Kim', avatar: 'AK', text: 'Nice progress! Need help with certs?', time: '2 hours ago' },
        ]},
      ]
    },
    { id: 't3', title: 'Offline mode', status: 'doing', assignee: 'SR', assigneeName: 'Sam Rivera', createdBy: 'SR', createdByName: 'Sam Rivera', createdAt: 'Jan 19', dueOn: 'Feb 5', notes: 'Implement local-first data sync.',
      subtasks: [
        { id: 's7', title: 'Local database setup', status: 'done', assignee: 'SR', assigneeName: 'Sam Rivera', createdBy: 'SR', createdByName: 'Sam Rivera', createdAt: 'Jan 19', notes: 'Using SQLite for now, may switch to Realm later.', comments: [] },
        { id: 's8', title: 'Sync engine', status: 'doing', assignee: 'SR', assigneeName: 'Sam Rivera', createdBy: 'SR', createdByName: 'Sam Rivera', createdAt: 'Jan 19', notes: null, comments: [] },
      ],
      comments: []
    },
    { id: 't4', title: 'App store assets', status: 'todo', assignee: null, assigneeName: null, createdBy: 'AK', createdByName: 'Alex Kim', createdAt: 'Jan 20', dueOn: null, notes: null, subtasks: [], comments: [] },
    { id: 't5', title: 'Beta testing plan', status: 'todo', assignee: 'AK', assigneeName: 'Alex Kim', createdBy: 'MJ', createdByName: 'Maya Jones', createdAt: 'Jan 22', dueOn: 'Feb 10', notes: 'Coordinate with marketing for beta rollout.', subtasks: [], comments: [] },
  ],
};

const docContent = {
  c1: {
    title: 'Mobile App v2 - Product Spec',
    author: { name: 'Alex Kim', avatar: 'AK' },
    createdAt: 'Jan 22, 2025', updatedAt: '2 hours ago',
    content: '## Overview\nNative iOS and Android apps replacing our current React Native implementation.\n\n## Goals\n- Sub-100ms interaction latency\n- Full offline support\n- 60fps animations everywhere\n\n## Open Questions\n- Should we support tablets at launch?\n- What\'s our minimum iOS/Android version?',
    comments: [
      { id: 'cc1', user: 'Maya Jones', avatar: 'MJ', text: 'Love the performance goals. For tablets—skip for v1.', time: '1 hour ago', thread: [
        { id: 'cc1r1', user: 'Sam Rivera', avatar: 'SR', text: 'Agreed. Focus on phones first.', time: '50 min ago' },
        { id: 'cc1r2', user: 'Alex Kim', avatar: 'AK', text: 'Makes sense. Tablets in v1.1 then.', time: '45 min ago', quoteId: 'cc1r1' },
      ]},
      { id: 'cc2', user: 'Sam Rivera', avatar: 'SR', text: 'For OS versions: iOS 15+ and Android 10+ covers 95% of devices.', time: '45 min ago', quoteId: 'cc1', thread: [] },
    ],
  },
  sc1: {
    title: 'Meeting Notes',
    author: { name: 'Maya Jones', avatar: 'MJ' },
    createdAt: 'Jan 24, 2025', updatedAt: '1 day ago',
    content: '## Weekly Sync - Jan 24\n\n### Attendees\nAlex, Maya, Sam, Jordan\n\n### Updates\n- Auth flow is complete and merged\n- Push notifications in progress (FCM done, APNs WIP)\n- Offline sync demo scheduled for Monday\n\n### Action Items\n- Alex: Review APNs certificate setup\n- Sam: Prepare sync demo\n- Maya: Update Figma with new notification designs\n\n### Next Meeting\nJan 31, 2025 at 10am',
    comments: [
      { id: 'mc1', user: 'Alex Kim', avatar: 'AK', text: 'Added the cert setup to my todo list.', time: '1 day ago', thread: [] },
    ],
  },
  sc2: {
    title: 'Onboarding Guide',
    author: { name: 'Jordan Lee', avatar: 'JL' },
    createdAt: 'Jan 10, 2025', updatedAt: '3 days ago',
    content: '## Welcome to the Team!\n\nThis guide will help you get set up and productive quickly.\n\n## First Day\n1. Set up your development environment\n2. Clone the main repositories\n3. Join the #general and #engineering channels\n4. Meet with your buddy for a walkthrough\n\n## First Week\n- Complete security training\n- Review the architecture docs\n- Pick up a starter task from the backlog\n- Attend the weekly sync\n\n## Resources\n- Engineering wiki: wiki.teamspace.dev\n- Design system: figma.com/teamspace\n- API docs: api.teamspace.dev/docs',
    comments: [],
  },
};

const messagesData = {
  ch1: [
    { id: 'm1', user: 'Alex Kim', avatar: 'AK', text: 'Pushed the new auth flow. Ready for review.', time: '10:32 AM', thread: [
      { id: 'm1r1', user: 'Maya Jones', avatar: 'MJ', text: 'Taking a look now!', time: '10:35 AM' },
      { id: 'm1r2', user: 'Sam Rivera', avatar: 'SR', text: 'The SSO part looks clean 👍', time: '10:41 AM' },
      { id: 'm1r3', user: 'Maya Jones', avatar: 'MJ', text: 'Agreed, nice token refresh logic', time: '10:43 AM', quoteId: 'm1r2' },
    ]},
    { id: 'm2', user: 'Sam Rivera', avatar: 'SR', text: 'Offline sync is working! Demo at standup?', time: '11:15 AM', thread: [] },
    { id: 'm3', user: 'Maya Jones', avatar: 'MJ', text: 'Yes! Can\'t wait to see it.', time: '11:18 AM', quoteId: 'm2', thread: [] },
  ],
  sch1: [
    { id: 'g1', user: 'Jordan Lee', avatar: 'JL', text: 'Reminder: all-hands at 2pm today', time: '9:00 AM', thread: [{ id: 'g1r1', user: 'Maya Jones', avatar: 'MJ', text: 'Thanks!', time: '9:15 AM' }]},
    { id: 'g2', user: 'Alex Kim', avatar: 'AK', text: 'Will there be pizza? 🍕', time: '9:30 AM', quoteId: 'g1', thread: [] },
  ],
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState('projects');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState({ type: 'list', id: 'l1' });
  const [viewMode, setViewMode] = useState('board');
  const [openThread, setOpenThread] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [projectCollapsed, setProjectCollapsed] = useState({});

  const toggleProject = (id) => setProjectCollapsed(p => ({ ...p, [id]: !p[id] }));
  const toggleSection = (s) => setCollapsed(p => ({ ...p, [s]: !p[s] }));
  const selectItem = (type, id) => { setActiveItem({ type, id }); setOpenThread(null); setSelectedTask(null); };
  const isActive = (type, id) => activeItem.type === type && activeItem.id === id;

  const getItemName = () => {
    for (const p of initialData.projects) {
      const item = p.items.find(i => i.id === activeItem.id && i.type === activeItem.type);
      if (item) return item.name;
    }
    if (activeItem.type === 'list') return initialData.lists.find(i => i.id === activeItem.id)?.name || '';
    if (activeItem.type === 'doc') return initialData.docs.find(i => i.id === activeItem.id)?.name || '';
    if (activeItem.type === 'channel') return initialData.channels.find(i => i.id === activeItem.id)?.name || '';
    if (activeItem.type === 'dm') return initialData.dms.find(i => i.id === activeItem.id)?.name || '';
    return '';
  };

  const currentMessages = messagesData[activeItem.id] || [];
  const currentTasks = listItemsData[activeItem.id] || [];
  const doc = docContent[activeItem.id];
  const groupedByStatus = { todo: currentTasks.filter(t => t.status === 'todo'), doing: currentTasks.filter(t => t.status === 'doing'), done: currentTasks.filter(t => t.status === 'done') };
  const flatMessages = [...currentMessages, ...currentMessages.flatMap(m => m.thread || [])];
  const flatDocComments = doc ? [...doc.comments, ...doc.comments.flatMap(c => c.thread || [])] : [];

  return (
    <div className="h-screen flex bg-slate-50 text-slate-800 text-sm">
      {/* Outer Sidebar - Fixed */}
      <div className="w-14 bg-slate-950 flex flex-col items-center py-3 gap-1 flex-shrink-0">
        <button 
          onClick={() => setActiveCategory('home')} 
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeCategory === 'home' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Home size={20} />
        </button>
        <button 
          onClick={() => setActiveCategory('projects')} 
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeCategory === 'projects' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Folder size={20} />
        </button>
        <button 
          onClick={() => setActiveCategory('lists')} 
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeCategory === 'lists' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Columns3 size={20} />
        </button>
        <button 
          onClick={() => setActiveCategory('docs')} 
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeCategory === 'docs' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <FileText size={20} />
        </button>
        <button 
          onClick={() => setActiveCategory('channels')} 
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeCategory === 'channels' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Hash size={20} />
        </button>
        <button 
          onClick={() => setActiveCategory('dms')} 
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeCategory === 'dms' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <Users size={20} />
        </button>
        
        <div className="flex-1" />
        
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        )}
        
        <div className="w-10 h-10 rounded-lg flex items-center justify-center">
          <Avatar initials="AK" size="sm" online={true} />
        </div>
      </div>

      {/* Collapsed sidebar edge - click to expand */}
      {!sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(true)} 
          className="w-2 bg-slate-900 cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0 relative"
        >
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-700 hover:bg-blue-500" />
        </div>
      )}
      {sidebarOpen && (
        <div className="w-52 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 relative">
          <div 
            onClick={() => setSidebarOpen(false)} 
            className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 transition-colors z-10 group"
          >
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-700 group-hover:bg-blue-500" />
          </div>
          <div className="p-3 border-b border-slate-700">
            <div className="font-semibold text-white text-sm">
            {activeCategory === 'home' && 'Home'}
            {activeCategory === 'projects' && 'Projects'}
            {activeCategory === 'lists' && 'Lists'}
            {activeCategory === 'docs' && 'Docs'}
            {activeCategory === 'channels' && 'Channels'}
            {activeCategory === 'dms' && 'Direct Messages'}
          </div>
        </div>

        <div className="flex-1 overflow-auto py-2">
          {/* Home */}
          {activeCategory === 'home' && (
            <div className="px-2 space-y-1">
              <div onClick={() => selectItem('home', null)} className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer bg-slate-700 text-white">
                <Home size={16} /> <span>Overview</span>
              </div>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-500 uppercase">Recent</div>
              <div onClick={() => selectItem('list', 'l1')} className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer hover:bg-slate-800">
                <Columns3 size={14} className="text-slate-400" /> <span className="text-sm">Sprint Board</span>
              </div>
              <div onClick={() => selectItem('doc', 'c1')} className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer hover:bg-slate-800">
                <FileText size={14} className="text-slate-400" /> <span className="text-sm">Product Spec</span>
              </div>
              <div onClick={() => selectItem('channel', 'sch1')} className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer hover:bg-slate-800">
                <Hash size={14} className="text-slate-400" /> <span className="text-sm">general</span>
              </div>
            </div>
          )}

          {/* Projects */}
          {activeCategory === 'projects' && (
            <div className="px-2 space-y-0.5">
              {[...initialData.projects].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map(project => (
                <div key={project.id}>
                  <button onClick={() => toggleProject(project.id)} className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-slate-300 hover:bg-slate-800 text-left">
                    {projectCollapsed[project.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    <Folder size={14} className="text-slate-400" />
                    <span className="truncate flex-1 text-sm">{project.name}</span>
                    {project.starred && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                  </button>
                  {!projectCollapsed[project.id] && (
                    <div className="space-y-0.5">
                      {project.items.map(item => (
                        <div key={item.id} onClick={() => selectItem(item.type, item.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm ${isActive(item.type, item.id) ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>
                          <ItemIcon type={item.type} />
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-left text-sm mt-2">
                <Plus size={14} /> New project
              </button>
            </div>
          )}

          {/* Lists */}
          {activeCategory === 'lists' && (
            <div className="px-2 space-y-0.5">
              {[...initialData.lists].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map(item => (
                <div key={item.id} onClick={() => selectItem('list', item.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm ${isActive('list', item.id) ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>
                  <Columns3 size={14} className="text-slate-400" />
                  <span className="truncate flex-1">{item.name}</span>
                  {item.starred && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                </div>
              ))}
              <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-left text-sm mt-2">
                <Plus size={14} /> New list
              </button>
            </div>
          )}

          {/* Docs */}
          {activeCategory === 'docs' && (
            <div className="px-2 space-y-0.5">
              {[...initialData.docs].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map(item => (
                <div key={item.id} onClick={() => selectItem('doc', item.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm ${isActive('doc', item.id) ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>
                  <FileText size={14} className="text-slate-400" />
                  <span className="truncate flex-1">{item.name}</span>
                  {item.starred && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                </div>
              ))}
              <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-left text-sm mt-2">
                <Plus size={14} /> New doc
              </button>
            </div>
          )}

          {/* Channels */}
          {activeCategory === 'channels' && (
            <div className="px-2 space-y-0.5">
              {[...initialData.channels].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map(item => (
                <div key={item.id} onClick={() => selectItem('channel', item.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm ${isActive('channel', item.id) ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>
                  <Hash size={14} className="text-slate-400" />
                  <span className="truncate flex-1">{item.name}</span>
                  {item.starred && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                </div>
              ))}
              <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-left text-sm mt-2">
                <Plus size={14} /> New channel
              </button>
            </div>
          )}

          {/* DMs */}
          {activeCategory === 'dms' && (
            <div className="px-2 space-y-0.5">
              {[...initialData.dms].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0)).map(item => (
                <div key={item.id} onClick={() => selectItem('dm', item.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm ${isActive('dm', item.id) ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}>
                  <Avatar initials={item.avatar} size="sm" online={item.online} />
                  <span className="truncate flex-1">{item.name}</span>
                  {item.starred && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                </div>
              ))}
              <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-left text-sm mt-2">
                <Plus size={14} /> New message
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex min-w-0">
        {/* List View */}
        {activeItem.type === 'list' && (
          <>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4">
                <h1 className="font-semibold text-lg">{getItemName()}</h1>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('board')} className={`px-3 py-1 rounded-md text-sm flex items-center gap-1.5 ${viewMode === 'board' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><Columns3 size={14} /> Board</button>
                  <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded-md text-sm flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><Table size={14} /> Table</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-slate-100">
                {viewMode === 'board' ? (
                  <div className="flex gap-4 h-full">
                    {['todo', 'doing', 'done'].map(status => (
                      <div key={status} className="w-72 flex-shrink-0 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2"><StatusBadge status={status} /><span className="text-slate-400 text-sm">{groupedByStatus[status].length}</span></div>
                          <Plus size={16} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                        </div>
                        <div className="flex-1 space-y-2 overflow-auto">
                          {groupedByStatus[status].map(task => (
                            <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md cursor-pointer">
                              <div className="font-medium text-slate-800 mb-2">{task.title}</div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  {task.dueOn && <span className="flex items-center gap-1"><Calendar size={12} />{task.dueOn}</span>}
                                  {task.subtasks?.length > 0 && <span className="flex items-center gap-1"><CheckSquare size={12} />{task.subtasks.filter(s => s.status === 'done').length}/{task.subtasks.length}</span>}
                                  {task.comments?.length > 0 && <span className="flex items-center gap-1"><MessageSquare size={12} />{task.comments.length}</span>}
                                </div>
                                {task.assignee && <Avatar initials={task.assignee} size="sm" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {['todo', 'doing', 'done'].map(status => (
                      <div key={status}>
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                          <StatusBadge status={status} />
                          <span className="text-sm text-slate-400">{groupedByStatus[status].length}</span>
                        </div>
                        {groupedByStatus[status].map(task => (
                          <div key={task.id} onClick={() => setSelectedTask(task)} className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center gap-4">
                            <span className="flex-1 font-medium">{task.title}</span>
                            <span className="text-sm text-slate-400 w-24">{task.dueOn || '—'}</span>
                            <div className="w-24">{task.assignee ? <div className="flex items-center gap-2"><Avatar initials={task.assignee} size="sm" /><span className="text-sm">{task.assignee}</span></div> : <span className="text-slate-400">—</span>}</div>
                            <div className="flex items-center gap-2 text-slate-400 w-16">
                              {task.subtasks?.length > 0 && <span className="flex items-center gap-1 text-xs"><CheckSquare size={12} />{task.subtasks.filter(s => s.status === 'done').length}/{task.subtasks.length}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
          </>
        )}

        {/* Doc View */}
        {activeItem.type === 'doc' && doc && (
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col bg-slate-50 overflow-auto">
              <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
                <h1 className="font-semibold text-lg">{doc.title}</h1>
                <button className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg">Edit</button>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="max-w-3xl mx-auto py-8 px-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                      <Avatar initials={doc.author.avatar} />
                      <div>
                        <div className="font-medium text-slate-800">{doc.author.name}</div>
                        <div className="text-xs text-slate-400">Posted {doc.createdAt} · Updated {doc.updatedAt}</div>
                      </div>
                    </div>
                    <div className="prose prose-slate">
                      {doc.content.split('\n').map((line, i) => {
                        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-slate-800 mt-4 mb-2">{line.slice(3)}</h2>;
                        if (line.startsWith('- ')) return <li key={i} className="text-slate-600 ml-4">{line.slice(2)}</li>;
                        if (line === '') return <br key={i} />;
                        return <p key={i} className="text-slate-600">{line}</p>;
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                      <MessageSquare size={16} className="text-slate-400" />
                      <span className="font-semibold">Comments</span>
                      <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{doc.comments.length}</span>
                    </div>
                    <div className="p-4 space-y-4">
                      {doc.comments.map(comment => <Message key={comment.id} msg={comment} onStartThread={setOpenThread} onQuote={() => {}} allMessages={flatDocComments} />)}
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                      <div className="flex items-start gap-3">
                        <Avatar initials="AK" size="sm" />
                        <div className="flex-1">
                          <textarea placeholder="Add a comment..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none bg-white" rows={2} />
                          <div className="flex justify-end mt-2"><button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Comment</button></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {openThread && <ThreadPanel parentMsg={openThread} onClose={() => setOpenThread(null)} allMessages={flatDocComments} />}
          </div>
        )}

        {/* Channel / DM View */}
        {(activeItem.type === 'channel' || activeItem.type === 'dm') && (
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col bg-white">
              <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  {activeItem.type === 'channel' ? <Hash size={18} className="text-slate-400" /> : <Avatar initials={initialData.dms.find(d => d.id === activeItem.id)?.avatar || '??'} size="sm" />}
                  <h1 className="font-semibold">{getItemName()}</h1>
                </div>
                <Search size={18} className="text-slate-400 cursor-pointer hover:text-slate-600" />
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {currentMessages.map(msg => <Message key={msg.id} msg={msg} onStartThread={setOpenThread} onQuote={() => {}} allMessages={flatMessages} />)}
              </div>
              <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={`Message ${activeItem.type === 'channel' ? '#' : ''}${getItemName()}`} className="flex-1 bg-transparent outline-none" />
                  <button className="text-slate-400 hover:text-blue-600"><Send size={18} /></button>
                </div>
              </div>
            </div>
            {openThread && <ThreadPanel parentMsg={openThread} onClose={() => setOpenThread(null)} allMessages={flatMessages} />}
          </div>
        )}
      </div>
    </div>
  );
}
