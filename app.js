// 初始化 GUN 實例
const gun = Gun({
    peers: ['http://gun-matrix.herokuapp.com/gun']
});

// 建立故事和聊天的資料節點
const story = gun.get('collaborative-story');
const chat = gun.get('chat-messages');
const users = gun.get('users');

// 星名設定和個人軌域功能
let currentUser = {
    starname: localStorage.getItem('starname') || '',
    stories: []
};

// 星名設定對話框功能
const starnameModal = document.getElementById('starname-modal');
const starnameInput = document.getElementById('starname-input');
const starnameSubmit = document.getElementById('starname-submit');
const userStarnameDisplay = document.querySelector('.user-starname');

// 檢查是否需要顯示星名設定對話框
function checkStarname() {
    if (!currentUser.starname) {
        starnameModal.classList.remove('hidden');
    } else {
        starnameModal.classList.add('hidden');
        updateUserDisplay();
    }
}

// 設定星名
starnameSubmit.addEventListener('click', () => {
    const starname = starnameInput.value.trim();
    if (starname) {
        currentUser.starname = starname;
        localStorage.setItem('starname', starname);
        starnameModal.classList.add('hidden');
        updateUserDisplay();
        // 更新使用者資料
        users.get(starname).put({
            starname: starname,
            joinDate: Date.now()
        });
    }
});

// 更新個人軌域顯示
function updateUserDisplay() {
    userStarnameDisplay.textContent = currentUser.starname;
    updatePersonalStories();
}

// 更新個人故事列表
function updatePersonalStories() {
    const myStories = document.querySelector('.my-stories');
    myStories.innerHTML = '';
    
    story.map().once((data, id) => {
        if (data && data.author === currentUser.starname) {
            const storyCard = document.createElement('div');
            storyCard.className = 'my-story-card';
            const preview = data.content.length > 50 
                ? data.content.substring(0, 50) + '...' 
                : data.content;
            
            storyCard.innerHTML = `
                <div class="my-story-preview">${preview}</div>
                <div class="my-story-date">${new Date(data.timestamp).toLocaleDateString()}</div>
            `;
            
            storyCard.addEventListener('click', () => {
                // 切換到編輯頁面
                document.querySelectorAll('.tab-btn').forEach(tab => {
                    if (tab.dataset.tab === 'editor') {
                        tab.click();
                    }
                });
            });
            
            myStories.appendChild(storyCard);
            updateStoryCount();
        }
    });
}

// 更新故事數量
function updateStoryCount() {
    const storyCountElement = document.querySelector('.story-count');
    let count = document.querySelectorAll('.my-story-card').length;
    storyCountElement.textContent = `${count} 個星光`;
}

// 分頁切換功能
function initTabs() {
    const tabs = document.querySelectorAll('.side-nav .tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有活動狀態
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            // 設置當前分頁為活動狀態
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// 用戶名稱儲存
let username = localStorage.getItem('username') || '';
const usernameInput = document.getElementById('username');
usernameInput.value = username;
usernameInput.addEventListener('change', (e) => {
    username = e.target.value;
    localStorage.setItem('username', username);
});

// 故事列表顯示功能
function updateStoryList() {
    const storyList = document.getElementById('story-list');
    storyList.innerHTML = '';
    
    const stories = new Map();
    story.map().once((data, id) => {
        if (data && data.content) {
            stories.set(data.timestamp, {
                id,
                author: data.author,
                content: data.content,
                timestamp: data.timestamp
            });
        }
    });

    // 將故事按時間排序並顯示
    Array.from(stories.entries())
        .sort((a, b) => b[0] - a[0])
        .forEach(([timestamp, data]) => {
            const storyCard = document.createElement('div');
            storyCard.className = 'story-card';
            const preview = data.content.length > 100 
                ? data.content.substring(0, 100) + '...' 
                : data.content;
            
            storyCard.innerHTML = `
                <div class="story-meta">
                    <span class="username">${data.author}</span>
                    <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                </div>
                <p>${preview}</p>
            `;
            
            // 點擊故事卡片時切換到編輯頁面並載入內容
            storyCard.addEventListener('click', () => {
                // 切換到編輯頁面
                document.querySelectorAll('.tab-btn').forEach(tab => {
                    if (tab.dataset.tab === 'editor') {
                        tab.click();
                    }
                });
                // 載入故事內容
                updateStoryDisplay();
            });
            
            storyList.appendChild(storyCard);
        });
}

// 故事編輯功能
const storyContent = document.getElementById('story-content');
const storyEditor = document.getElementById('story-editor');
const submitStory = document.getElementById('submit-story');

// 載入和顯示故事內容
story.map().on((data, id) => {
    if (data && data.content) {
        updateStoryDisplay();
        updateStoryList();
        updatePersonalStories();
    }
});

function updateStoryDisplay() {
    storyContent.innerHTML = '';
    const stories = new Map();
    
    story.map().once((data, id) => {
        if (data && data.content) {
            stories.set(data.timestamp, {
                author: data.author,
                content: data.content,
                timestamp: data.timestamp
            });
        }
    });

    // 按時間順序顯示故事
    Array.from(stories.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([timestamp, data]) => {
            const div = document.createElement('div');
            div.className = 'story-content';
            div.innerHTML = `
                <div class="story-meta">
                    <span class="username">${data.author}</span>
                    <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                </div>
                <p>${data.content}</p>
            `;
            storyContent.appendChild(div);
        });
    
    storyContent.scrollTop = storyContent.scrollHeight;
}

// 提交故事內容
submitStory.addEventListener('click', () => {
    if (!currentUser.starname) {
        alert('請先設定你的星名！');
        checkStarname();
        return;
    }
    if (!storyEditor.value.trim()) {
        alert('請輸入故事內容！');
        return;
    }

    const content = storyEditor.value.trim();
    story.set({
        author: currentUser.starname,
        content: content,
        timestamp: Date.now()
    });
    storyEditor.value = '';
});

// 聊天功能
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendMessage = document.getElementById('send-message');

// 載入和顯示聊天訊息
chat.map().on((data, id) => {
    if (data && data.message) {
        updateChatDisplay();
    }
});

function updateChatDisplay() {
    chatMessages.innerHTML = '';
    const messages = new Map();
    
    chat.map().once((data, id) => {
        if (data && data.message) {
            messages.set(data.timestamp, {
                author: data.author,
                message: data.message,
                timestamp: data.timestamp
            });
        }
    });

    // 按時間順序顯示訊息
    Array.from(messages.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([timestamp, data]) => {
            const div = document.createElement('div');
            div.className = 'chat-message';
            div.innerHTML = `
                <span class="username">${data.author}</span>
                <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                <p>${data.message}</p>
            `;
            chatMessages.appendChild(div);
        });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 發送聊天訊息
sendMessage.addEventListener('click', sendChatMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {
    if (!currentUser.starname) {
        alert('請先設定你的星名！');
        checkStarname();
        return;
    }
    if (!messageInput.value.trim()) {
        return;
    }

    const message = messageInput.value.trim();
    chat.set({
        author: currentUser.starname,
        message: message,
        timestamp: Date.now()
    });
    messageInput.value = '';
}

// 初始化頁面
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    checkStarname();
    updateStoryList();
    
    // 監聽故事變化
    story.map().on((data, id) => {
        if (data && data.content) {
            updateStoryDisplay();
            updateStoryList();
            updatePersonalStories();
        }
    });
});