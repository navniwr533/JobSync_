// Local Database Simulation using localStorage
class LocalDatabase {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Initialize default data if not exists
        if (!localStorage.getItem('jobsync_users')) {
            localStorage.setItem('jobsync_users', JSON.stringify({}));
        }
        if (!localStorage.getItem('jobsync_current_user')) {
            localStorage.setItem('jobsync_current_user', null);
        }
    }

    // User Authentication
    async registerUser(email, password, name = '') {
        const users = JSON.parse(localStorage.getItem('jobsync_users')) || {};
        
        if (users[email]) {
            throw new Error('User already exists');
        }

        const userId = 'user_' + Date.now();
        users[email] = {
            id: userId,
            email: email,
            name: name,
            password: password, // In real app, this should be hashed
            createdAt: new Date().toISOString(),
            resumeAnalyses: [],
            interviewResults: []
        };

        localStorage.setItem('jobsync_users', JSON.stringify(users));
        return { id: userId, email: email, name: name };
    }

    async loginUser(email, password) {
        const users = JSON.parse(localStorage.getItem('jobsync_users'));
        
        if (!users[email] || users[email].password !== password) {
            throw new Error('Invalid credentials');
        }

        const user = users[email];
        localStorage.setItem('jobsync_current_user', JSON.stringify(user));
        return user;
    }

    async logoutUser() {
        localStorage.setItem('jobsync_current_user', null);
    }

    getCurrentUser() {
        const userData = localStorage.getItem('jobsync_current_user');
        return userData ? JSON.parse(userData) : null;
    }

    // Resume Analysis Storage
    async saveResumeAnalysis(analysisData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error('No user logged in');

        const users = JSON.parse(localStorage.getItem('jobsync_users'));
        if (!users[currentUser.email].resumeAnalyses) {
            users[currentUser.email].resumeAnalyses = [];
        }

        const analysis = {
            id: 'analysis_' + Date.now(),
            ...analysisData,
            timestamp: new Date().toISOString()
        };

        users[currentUser.email].resumeAnalyses.push(analysis);
        localStorage.setItem('jobsync_users', JSON.stringify(users));
        
        // Update current user session
        currentUser.resumeAnalyses = users[currentUser.email].resumeAnalyses;
        localStorage.setItem('jobsync_current_user', JSON.stringify(currentUser));

        return analysis;
    }

    getLatestResumeAnalysis() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.resumeAnalyses) return null;

        const analyses = currentUser.resumeAnalyses;
        return analyses.length > 0 ? analyses[analyses.length - 1] : null;
    }

    // Interview Results Storage
    async saveInterviewResults(resultsData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error('No user logged in');

        const users = JSON.parse(localStorage.getItem('jobsync_users'));
        if (!users[currentUser.email].interviewResults) {
            users[currentUser.email].interviewResults = [];
        }

        const results = {
            id: 'interview_' + Date.now(),
            ...resultsData,
            timestamp: new Date().toISOString()
        };

        users[currentUser.email].interviewResults.push(results);
        localStorage.setItem('jobsync_users', JSON.stringify(users));
        
        // Update current user session
        currentUser.interviewResults = users[currentUser.email].interviewResults;
        localStorage.setItem('jobsync_current_user', JSON.stringify(currentUser));

        return results;
    }

    async getAllInterviewResults() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];
        return currentUser.interviewResults || [];
    }

    // Get user progress over time
    getUserProgress() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.progress) return [];
        return currentUser.progress;
    }

    // Save progress entry
    saveProgressEntry(entry) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        const users = JSON.parse(localStorage.getItem('jobsync_users'));
        if (!users[currentUser.email].progress) {
            users[currentUser.email].progress = [];
        }

        const progressEntry = {
            date: entry.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            resumeScore: entry.resumeScore || 0,
            interviewScore: entry.interviewScore || 0,
            overallScore: entry.overallScore || 0,
            timestamp: new Date().toISOString()
        };

        users[currentUser.email].progress.push(progressEntry);
        localStorage.setItem('jobsync_users', JSON.stringify(users));
        
        // Update current user session
        currentUser.progress = users[currentUser.email].progress;
        localStorage.setItem('jobsync_current_user', JSON.stringify(currentUser));

        return progressEntry;
    }

    // Clear all data (for testing)
    clearAllData() {
        localStorage.removeItem('jobsync_users');
        localStorage.removeItem('jobsync_current_user');
        this.initializeDatabase();
    }
}

// Export for use in other files
window.LocalDatabase = LocalDatabase;