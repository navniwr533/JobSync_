// Main Application JavaScript
class JobSyncApp {
    constructor() {
        this.db = new LocalDatabase();
        this.voice = new VoiceRecognition();
        this.interviewSystem = new InterviewSystem(this.db, this.voice);
        this.dashboardViz = new DashboardVisualization();
        this.currentUser = null;
        this.uploadedResumeFile = null;
        this.uploadedJDFile = null;
        
        this.initializeApp();
    }

    initializeApp() {
        // Check for existing user session
        this.currentUser = this.db.getCurrentUser();
        this.updateAuthUI();
        
        // Only initialize dashboard for logged-in users
        if (this.currentUser) {
            this.loadUserData();
            setTimeout(() => {
                this.dashboardViz.initializeDashboard();
            }, 1000);
        }
        
        this.setupEventListeners();
        console.log('JobSync app initialized successfully');
    }

    setupEventListeners() {
        // Auth event listeners
        document.getElementById('login-button').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('signup-button').addEventListener('click', () => this.showAuthModal('signup'));
        document.getElementById('logout-button').addEventListener('click', () => this.logout());
        document.getElementById('close-modal').addEventListener('click', () => this.hideAuthModal());
        document.getElementById('switch-auth-mode').addEventListener('click', () => this.toggleAuthMode());
        document.getElementById('auth-form').addEventListener('submit', (e) => this.handleAuthSubmit(e));
        
        // Dashboard login button
        const dashboardLoginBtn = document.getElementById('dashboard-login-btn');
        if (dashboardLoginBtn) {
            dashboardLoginBtn.addEventListener('click', () => this.showAuthModal('signup'));
        }
        
        // Resume login button
        const resumeLoginBtn = document.getElementById('resume-login-btn');
        if (resumeLoginBtn) {
            resumeLoginBtn.addEventListener('click', () => this.showAuthModal('signup'));
        }
        
        // Resume analysis event listeners
        const resumeUploadBtn = document.getElementById('resume-upload-button');
        const jdUploadBtn = document.getElementById('jd-upload-button');
        const resumeFileInput = document.getElementById('resume-file-input');
        const jdFileInput = document.getElementById('jd-file-input');
        
        resumeUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resumeFileInput.click();
        });
        
        jdUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            jdFileInput.click();
        });
        
        document.getElementById('resume-reupload-button').addEventListener('click', () => {
            this.resetResumeAnalysis();
        });
        
        resumeFileInput.addEventListener('change', (e) => this.handleResumeUpload(e));
        jdFileInput.addEventListener('change', (e) => this.handleJDUpload(e));

        const roadmapButton = document.getElementById('generate-roadmap-btn');
        if (roadmapButton) {
            roadmapButton.addEventListener('click', () => {
                const status = this.dashboardViz.renderRoadmap();
                if (status === 'generated') {
                    this.showSuccessNotification('Roadmap refreshed with the latest analysis.');
                } else if (status === 'covered') {
                    this.showSuccessNotification('No critical gaps detected—keep up the good work.');
                } else {
                    alert('Upload your resume and job description first to generate a roadmap.');
                }
            });
        }
        
        // Interview event listeners
        this.setupInterviewEventListeners();
        
        // FAQ accordion
        this.setupFAQAccordion();
    }

    setupInterviewEventListeners() {
        // Interview type selection
        document.querySelectorAll('.interview-type-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.startInterview(type);
            });
        });
        
        // Interview controls
        document.getElementById('start-full-interview-btn').addEventListener('click', () => {
            this.startInterview('mixed');
        });
        
        document.getElementById('end-interview-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to end the interview? Your progress will be saved.')) {
                this.interviewSystem.completeInterview();
            }
        });
        
        document.getElementById('next-question-btn').addEventListener('click', () => {
            this.interviewSystem.nextQuestion();
        });
        
        document.getElementById('prev-question-btn').addEventListener('click', () => {
            this.interviewSystem.prevQuestion();
        });
        
        document.getElementById('skip-question-btn').addEventListener('click', () => {
            this.interviewSystem.skipQuestion();
        });
        
        // Answer input
        document.getElementById('text-answer').addEventListener('input', () => {
            this.interviewSystem.updateAnswerWordCount();
            this.interviewSystem.simulateRealTimeFeedback();
        });
        
        // Voice recording
        document.getElementById('voice-record-btn').addEventListener('click', () => {
            this.handleVoiceRecording();
        });
        
        // Results actions
        document.getElementById('practice-again-btn').addEventListener('click', () => {
            this.interviewSystem.resetInterview();
        });
        
        document.getElementById('view-transcript-btn').addEventListener('click', () => {
            this.showTranscript();
        });
        
        document.getElementById('save-results-btn').addEventListener('click', () => {
            this.saveInterviewResults();
        });
    }

    // Authentication Methods
    showAuthModal(mode) {
        this.authMode = mode;
        this.updateAuthModalContent();
        document.getElementById('auth-modal').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('modal-content').classList.add('modal-transition-active');
        }, 10);
    }

    hideAuthModal() {
        document.getElementById('modal-content').classList.remove('modal-transition-active');
        setTimeout(() => {
            document.getElementById('auth-modal').classList.add('hidden');
            this.clearAuthForm();
        }, 300);
    }

    toggleAuthMode() {
        this.authMode = this.authMode === 'login' ? 'signup' : 'login';
        this.updateAuthModalContent();
    }

    updateAuthModalContent() {
        const title = document.getElementById('auth-title');
        const submit = document.getElementById('auth-submit');
        const switchMode = document.getElementById('switch-auth-mode');
        
        // Toggle form fields based on mode
        const nameField = document.getElementById('name-field');
        const confirmPasswordField = document.getElementById('confirm-password-field');
        const termsField = document.getElementById('terms-field');
        
        if (this.authMode === 'login') {
            title.textContent = 'Login to JobSync';
            submit.textContent = 'Log In';
            switchMode.textContent = "Don't have an account? Sign Up";
            
            // Hide signup-only fields
            nameField.classList.add('hidden');
            confirmPasswordField.classList.add('hidden');
            termsField.classList.add('hidden');
            
            // Remove required attributes
            document.getElementById('name').removeAttribute('required');
            document.getElementById('confirm-password').removeAttribute('required');
            document.getElementById('terms').removeAttribute('required');
        } else {
            title.textContent = 'Create JobSync Account';
            submit.textContent = 'Create Account';
            switchMode.textContent = 'Already have an account? Log In';
            
            // Show signup-only fields
            nameField.classList.remove('hidden');
            confirmPasswordField.classList.remove('hidden');
            termsField.classList.remove('hidden');
            
            // Add required attributes
            document.getElementById('name').setAttribute('required', 'required');
            document.getElementById('confirm-password').setAttribute('required', 'required');
            document.getElementById('terms').setAttribute('required', 'required');
        }
        
        this.clearAuthErrors();
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || password.length < 6) {
            this.showAuthError('Password must be at least 6 characters long.');
            return;
        }
        
        // Additional validation for signup
        if (this.authMode === 'signup') {
            const name = document.getElementById('name').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const terms = document.getElementById('terms').checked;
            
            if (!name.trim()) {
                this.showAuthError('Please enter your full name.');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showAuthError('Passwords do not match.');
                return;
            }
            
            if (!terms) {
                this.showAuthError('Please accept the Terms of Service and Privacy Policy.');
                return;
            }
        }
        
        this.showLoading(this.authMode === 'signup' ? 'Creating account...' : 'Logging in...');
        
        try {
            let user;
            if (this.authMode === 'signup') {
                const name = document.getElementById('name').value;
                await this.db.registerUser(email, password, name);
                user = await this.db.loginUser(email, password);
                console.log('User registered and logged in:', user.email);
            } else {
                user = await this.db.loginUser(email, password);
                console.log('User logged in:', user.email);
            }
            
            this.currentUser = user;
            this.updateAuthUI();
            this.hideAuthModal();
            this.loadUserData();
            
        } catch (error) {
            console.error('Authentication error:', error);
            this.showAuthError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async logout() {
        this.showLoading('Logging out...');
        try {
            await this.db.logoutUser();
            this.currentUser = null;
            this.updateAuthUI();
            this.resetUserData();
            console.log('User logged out');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.hideLoading();
        }
    }

    updateAuthUI() {
        const authControls = document.getElementById('auth-controls');
        const userProfile = document.getElementById('user-profile');
        const userDisplay = document.getElementById('user-display');
        const dashboardLoginRequired = document.getElementById('dashboard-login-required');
        const dashboardContent = document.getElementById('dashboard-content');
        const resumeLoginRequired = document.getElementById('resume-login-required');
        const resumeAnalysisContent = document.getElementById('resume-analysis-content');
        
        if (this.currentUser) {
            // Show user profile, hide auth controls
            authControls.classList.add('hidden');
            userProfile.classList.remove('hidden');
            userDisplay.textContent = `Welcome, ${this.currentUser.name || this.currentUser.email}`;
            
            // Show dashboard content, hide login prompt
            if (dashboardLoginRequired) {
                dashboardLoginRequired.classList.add('hidden');
            }
            if (dashboardContent) {
                dashboardContent.classList.remove('hidden');
                // Initialize dashboard visualizations for logged-in user
                setTimeout(() => {
                    this.dashboardViz.initializeDashboard();
                }, 500);
            }
            
            // Show resume analysis content, hide login prompt
            if (resumeLoginRequired) {
                resumeLoginRequired.classList.add('hidden');
            }
            if (resumeAnalysisContent) {
                resumeAnalysisContent.classList.remove('hidden');
            }
        } else {
            // Show auth controls, hide user profile
            authControls.classList.remove('hidden');
            userProfile.classList.add('hidden');
            
            // Hide dashboard content, show login prompt
            if (dashboardLoginRequired) {
                dashboardLoginRequired.classList.remove('hidden');
            }
            if (dashboardContent) {
                dashboardContent.classList.add('hidden');
            }
            
            // Hide resume analysis content, show login prompt
            if (resumeLoginRequired) {
                resumeLoginRequired.classList.remove('hidden');
            }
            if (resumeAnalysisContent) {
                resumeAnalysisContent.classList.add('hidden');
            }
        }
    }

    showAuthError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    clearAuthErrors() {
        document.getElementById('error-message').classList.add('hidden');
    }

    clearAuthForm() {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        this.clearAuthErrors();
    }

    // Resume Analysis Methods
    async handleResumeUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('Resume file selected:', file.name, file.type, file.size);
        
        // Validate file type
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF, DOC, DOCX, or TXT file');
            e.target.value = null;
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            e.target.value = null;
            return;
        }
        
        this.showLoading(`Reading ${file.name}...`);
        
        // Simulate upload progress
        setTimeout(() => {
            this.uploadedResumeFile = file;
            this.updateUploadUI();
            this.hideLoading();
            console.log('Resume uploaded, checking if can run analysis...');
            this.checkAndRunAnalysis();
        }, 500);
        
        e.target.value = null;
    }

    async handleJDUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('JD file selected:', file.name, file.type, file.size);
        
        // Validate file type
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF, DOC, DOCX, or TXT file');
            e.target.value = null;
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            e.target.value = null;
            return;
        }
        
        this.showLoading(`Reading ${file.name}...`);
        
        // Simulate upload progress
        setTimeout(() => {
            this.uploadedJDFile = file;
            this.updateUploadUI();
            this.hideLoading();
            console.log('JD uploaded, checking if can run analysis...');
            this.checkAndRunAnalysis();
        }, 500);
        
        e.target.value = null;
    }

    updateUploadUI() {
        // Update UI to show which files have been uploaded
        const resumeBtn = document.getElementById('resume-upload-button');
        const jdBtn = document.getElementById('jd-upload-button');
        
        if (this.uploadedResumeFile) {
            resumeBtn.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                ${this.uploadedResumeFile.name}
            `;
            resumeBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            resumeBtn.classList.remove('bg-primary-blue', 'hover:bg-blue-700');
        }
        
        if (this.uploadedJDFile) {
            jdBtn.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                ${this.uploadedJDFile.name}
            `;
            jdBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            jdBtn.classList.remove('bg-primary-blue', 'hover:bg-blue-700');
        }
    }

    async checkAndRunAnalysis() {
        console.log('Checking analysis conditions:', {
            hasResume: !!this.uploadedResumeFile,
            hasJD: !!this.uploadedJDFile,
            isLoggedIn: !!this.currentUser
        });
        
        if (this.uploadedResumeFile && this.uploadedJDFile) {
            if (!this.currentUser) {
                alert('Please log in to perform resume analysis.');
                return;
            }
            console.log('Starting analysis...');
            await this.performResumeAnalysis();
        } else {
            this.showUploadStatus();
        }
    }

    showUploadStatus() {
        if (this.uploadedResumeFile && !this.uploadedJDFile) {
            // Show notification that we need JD
            const message = document.createElement('div');
            message.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
            message.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Resume uploaded! Now upload the job description to start analysis.</span>
                </div>
            `;
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 4000);
            
        } else if (this.uploadedJDFile && !this.uploadedResumeFile) {
            // Show notification that we need resume
            const message = document.createElement('div');
            message.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
            message.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Job description uploaded! Now upload your resume to start analysis.</span>
                </div>
            `;
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 4000);
        }
    }

    async performResumeAnalysis() {
        console.log('performResumeAnalysis called');
        this.showLoading('Preparing analysis...');
        
        try {
            // Step 1: Read files with progress
            this.updateLoadingMessage('Reading resume file...');
            console.log('Reading resume file:', this.uploadedResumeFile.name);
            const resumeContent = await this.readFileContent(this.uploadedResumeFile);
            console.log('Resume content length:', resumeContent.length);
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.updateLoadingMessage('Reading job description...');
            console.log('Reading JD file:', this.uploadedJDFile.name);
            const jdContent = await this.readFileContent(this.uploadedJDFile);
            console.log('JD content length:', jdContent.length);
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Step 2: Analyze ATS compatibility
            this.updateLoadingMessage('Analyzing ATS compatibility...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Step 3: Keyword matching
            this.updateLoadingMessage('Matching keywords with job requirements...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Step 4: Experience analysis
            this.updateLoadingMessage('Analyzing experience relevance...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Step 5: Skill gap detection
            this.updateLoadingMessage('Detecting skill gaps...');
            console.log('Performing analysis...');
            const analysisResults = this.performComprehensiveAnalysis(resumeContent, jdContent);
            console.log('Analysis results:', analysisResults);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Prepare data for storage
            const analysisData = {
                fileName: this.uploadedResumeFile.name,
                jdFileName: this.uploadedJDFile.name,
                fileType: this.uploadedResumeFile.type,
                fileSize: this.uploadedResumeFile.size,
                ...analysisResults
            };
            
            // Save to database
            this.updateLoadingMessage('Saving analysis results...');
            console.log('Saving to database...');
            await this.db.saveResumeAnalysis(analysisData);
            
            // Save progress entry for tracking improvement over time
            await this.db.saveProgressEntry({
                resumeScore: analysisResults.overallScore,
                interviewScore: 0, // Will be updated when interview is completed
                overallScore: analysisResults.overallScore,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
            
            // Display results
            this.hideLoading();
            console.log('Displaying results...');
            this.displayResumeResults(analysisData);
            
            // Show success notification
            this.showSuccessNotification('Analysis complete! Your results are ready.');
            
            // Refresh dashboard to show new data
            if (this.dashboardViz) {
                console.log('Refreshing dashboard...');
                this.dashboardViz.destroyCharts();
                setTimeout(() => {
                    this.dashboardViz.initializeDashboard();
                }, 500);
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.hideLoading();
            alert('Failed to analyze files. Please try again. Error: ' + error.message);
        }
    }

    updateLoadingMessage(message) {
        const loadingMessageEl = document.getElementById('loading-message');
        if (loadingMessageEl) {
            loadingMessageEl.textContent = message;
        }
    }

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
        notification.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    performComprehensiveAnalysis(resumeContent, jdContent) {
        // Implement the same analysis logic as before
        const analysis = {
            overallScore: 0,
            atsScore: 0,
            keywordScore: 0,
            experienceScore: 0,
            atsFeedback: "",
            keywordFeedback: "",
            experienceFeedback: "",
            recommendations: [],
            skillGaps: [] // Add skill gaps to analysis
        };

        // ATS Analysis
        const atsFactors = {
            hasStandardSections: resumeContent.toLowerCase().includes('experience') || resumeContent.toLowerCase().includes('education'),
            hasContactInfo: resumeContent.includes('@') || resumeContent.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/),
            standardFormat: true,
            readableFont: true
        };
        
        const atsFactorCount = Object.values(atsFactors).filter(Boolean).length;
        analysis.atsScore = Math.floor((atsFactorCount / 4) * 100);
        
        if (analysis.atsScore >= 90) {
            analysis.atsFeedback = "Perfect! Your resume is highly ATS-friendly.";
        } else if (analysis.atsScore >= 75) {
            analysis.atsFeedback = "Good ATS compatibility with minor areas for improvement.";
        } else {
            analysis.atsFeedback = "Consider improving document structure and adding missing standard sections.";
        }

        // Keyword Analysis
        const jdKeywords = this.extractKeywords(jdContent);
        const resumeKeywords = this.extractKeywords(resumeContent);
        const matchedKeywords = jdKeywords.filter(keyword => 
            resumeKeywords.some(resumeKeyword => 
                resumeKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(resumeKeyword.toLowerCase())
            )
        );
        
        analysis.keywordScore = jdKeywords.length > 0 
            ? Math.floor((matchedKeywords.length / jdKeywords.length) * 100) 
            : 75;
        
        if (analysis.keywordScore >= 80) {
            analysis.keywordFeedback = `Excellent keyword coverage! ${matchedKeywords.length}/${jdKeywords.length} key terms found.`;
        } else if (analysis.keywordScore >= 60) {
            analysis.keywordFeedback = `Good keyword match. Consider adding: ${jdKeywords.slice(0, 3).join(', ')}`;
        } else {
            analysis.keywordFeedback = `Low keyword match. Focus on including more job-specific terms.`;
        }

        // Experience Analysis
        const experienceYears = this.extractExperienceYears(resumeContent);
        const requiredYears = this.extractRequiredExperience(jdContent);
        let experienceGap = null;
        
        if (requiredYears !== null) {
            experienceGap = Math.max(0, requiredYears - experienceYears);
        }
        
        console.log('Experience analysis:', { experienceYears, requiredYears, experienceGap });
        
        if (requiredYears === null) {
            // JD did not specify any explicit experience requirement
            if (experienceYears > 0) {
                analysis.experienceScore = Math.min(100, Math.round(experienceYears * 15));
                analysis.experienceFeedback = `The job description does not specify years of experience. You mention ${experienceYears} years; consider clarifying relevant projects and responsibilities.`;
            } else {
                analysis.experienceScore = 35;
                analysis.experienceFeedback = "The job description does not specify experience, but your resume should clearly call out relevant internships, projects, or years in similar roles.";
            }
        } else if (experienceGap === 0 || experienceYears >= requiredYears) {
            analysis.experienceScore = 100;
            analysis.experienceFeedback = `Great! You indicate ${experienceYears} years of experience which meets the ${requiredYears} year requirement.`;
        } else if (experienceGap <= 2) {
            const ratio = requiredYears === 0 ? 0 : experienceYears / requiredYears;
            analysis.experienceScore = Math.max(50, Math.round(ratio * 100));
            analysis.experienceFeedback = `You list ${experienceYears} years of experience. The role asks for ${requiredYears} years. Highlight directly relevant work to bridge this gap.`;
        } else {
            const ratio = requiredYears === 0 ? 0 : experienceYears / requiredYears;
            analysis.experienceScore = Math.round(ratio * 100 * 0.75);
            analysis.experienceFeedback = `You mention ${experienceYears} years of experience, while the role requests ${requiredYears}. Emphasize transferable achievements and consider adding additional experience.`;
        }
        
        // Ensure experience score is between 0-100
        analysis.experienceScore = Math.max(0, Math.min(100, analysis.experienceScore));

        // Generate overall score
        analysis.overallScore = Math.floor(
            (analysis.atsScore * 0.2 + analysis.keywordScore * 0.4 + analysis.experienceScore * 0.4)
        );

        console.log('Analysis scores:', {
            atsScore: analysis.atsScore,
            keywordScore: analysis.keywordScore,
            experienceScore: analysis.experienceScore,
            overallScore: analysis.overallScore
        });

    // Generate skill gaps based on JD requirements vs resume skills (do this FIRST)
    analysis.skillGaps = this.analyzeSkillGaps(jdKeywords, matchedKeywords);

        // Generate recommendations based on actual scores
        if (analysis.atsScore < 80) {
            analysis.recommendations.push("Ensure your resume has clear sections: Contact, Summary, Experience, Education, Skills");
        }
        if (analysis.keywordScore < 70) {
            const missingKeywords = jdKeywords.filter(kw => !matchedKeywords.includes(kw));
            if (missingKeywords.length > 0) {
                analysis.recommendations.push(`Include these missing keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
            }
            analysis.recommendations.push("Add relevant technical skills and certifications mentioned in the JD");
        }
        if (analysis.experienceScore < 75) {
            analysis.recommendations.push("Quantify your achievements with specific metrics and numbers");
            analysis.recommendations.push("Highlight projects that demonstrate relevant skills");
        }
        if (experienceGap !== null && experienceGap > 0) {
            analysis.recommendations.push(`Highlight ${experienceGap} additional year(s) of relevant experience or showcase adjacent work to meet the requirement.`);
        }

        if (requiredYears === null && experienceYears === 0) {
            analysis.recommendations.push("Explicitly mention internship durations, project timelines, or freelance engagements to give reviewers confidence in your experience level.");
        }
        if (analysis.overallScore < 70) {
            analysis.recommendations.push("Tailor your professional summary to match the role requirements");
        }
        
        // Add skill gap recommendations
        const topSkillGaps = analysis.skillGaps.filter(sg => sg.gap > 0).slice(0, 3);
        topSkillGaps.forEach(skill => {
            analysis.recommendations.push(`Consider adding ${skill.name} to your skillset (mentioned in job description)`);
        });

        console.log('Generated recommendations:', analysis.recommendations);

        return analysis;
    }

    analyzeSkillGaps(jdKeywords, matchedKeywords) {
    const uniqueJDKeywords = Array.from(new Set((jdKeywords || []).map(keyword => (keyword || '').trim()).filter(Boolean)));
        const matchedSet = new Set((matchedKeywords || []).map(keyword => keyword.replace(/\s+/g, ' ').trim().toLowerCase()));

        const skillGaps = uniqueJDKeywords.map(keyword => {
            const normalized = keyword.replace(/\s+/g, ' ').trim();
            const normalizedLower = normalized.toLowerCase();
            const presentInResume = matchedSet.has(normalizedLower);
            return {
                name: this.formatKeywordDisplay(normalized),
                current: presentInResume ? 80 : 0,
                required: 80,
                gap: presentInResume ? 0 : 80
            };
        });

        console.log('Skill gaps found:', skillGaps);
        return skillGaps.sort((a, b) => b.gap - a.gap);
    }

    formatKeywordDisplay(keyword) {
        return keyword.split(' ').map(word => {
            if (!word) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }

    extractKeywords(text) {
        const commonKeywords = [
            'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
            'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes',
            'git', 'agile', 'scrum', 'html', 'css', 'bootstrap', 'tailwind',
            'management', 'leadership', 'project', 'team', 'communication',
            'problem solving', 'analytical', 'data analysis', 'machine learning',
            'artificial intelligence', 'backend', 'frontend', 'fullstack',
            'devops', 'ci/cd', 'testing', 'debugging', 'optimization'
        ];
        
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        return commonKeywords.filter(keyword => 
            words.some(word => word.includes(keyword) || keyword.includes(word))
        );
    }

    extractExperienceYears(resumeText) {
        const experienceMatches = resumeText.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi);
        if (experienceMatches) {
            const years = experienceMatches.map(match => parseInt(match.match(/\d+/)[0]));
            return Math.max(...years);
        }

        const rangeRegex = /(\d{4})\s*(?:-|–|to)\s*(present|current|\d{4})/gi;
        const currentYear = new Date().getFullYear();
        let totalYears = 0;
        let match;

        while ((match = rangeRegex.exec(resumeText)) !== null) {
            const startYear = parseInt(match[1], 10);
            const rawEnd = match[2];
            const endYear = /present|current/i.test(rawEnd) ? currentYear : parseInt(rawEnd, 10);

            if (Number.isNaN(startYear) || Number.isNaN(endYear) || endYear < startYear) {
                continue;
            }

            const contextStart = Math.max(0, match.index - 80);
            const contextText = resumeText.slice(contextStart, match.index).toLowerCase();
            const contextKeywords = /(experience|worked|role|position|intern|contract|consultant|developer|engineer|manager|analyst|designer|lead|specialist)/;

            if (contextKeywords.test(contextText)) {
                totalYears += Math.max(0, endYear - startYear + 1);
            }
        }

        if (totalYears > 0) {
            return Math.min(totalYears, 40);
        }

        return 0;
    }

    extractRequiredExperience(jdText) {
        const reqMatches = jdText.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi);
        if (reqMatches) {
            const years = reqMatches.map(match => parseInt(match.match(/\d+/)[0]));
            return Math.max(...years);
        }
        return null;
    }

    displayResumeResults(data) {
        // Show results
        document.getElementById('resume-placeholder').classList.add('hidden');
        document.getElementById('resume-progress-card').classList.remove('hidden');

        // File information
        document.getElementById('resume-file-name').textContent = data.fileName;
        document.getElementById('jd-file-name').textContent = data.jdFileName;

        // Overall score with animation
        const score = data.overallScore || 0;
        document.getElementById('resume-score').textContent = `${score}%`;
        
        // Score interpretation
        let interpretation = "";
        if (score >= 85) interpretation = "Excellent match! Your resume strongly aligns with this role.";
        else if (score >= 70) interpretation = "Good match with room for optimization.";
        else if (score >= 55) interpretation = "Moderate match. Consider targeted improvements.";
        else interpretation = "Significant gaps identified. Review recommendations below.";
        
        document.getElementById('score-interpretation').textContent = interpretation;
        
        // Animate progress bars with delay
        setTimeout(() => {
            document.getElementById('resume-progress-bar').style.width = `${score}%`;
            
            // Detailed scores
            document.getElementById('ats-score').textContent = `${data.atsScore}%`;
            document.getElementById('ats-progress').style.width = `${data.atsScore}%`;
            document.getElementById('ats-feedback').textContent = data.atsFeedback;
            
            document.getElementById('keyword-score').textContent = `${data.keywordScore}%`;
            document.getElementById('keyword-progress').style.width = `${data.keywordScore}%`;
            document.getElementById('keyword-feedback').textContent = data.keywordFeedback;
            
            document.getElementById('experience-score').textContent = `${data.experienceScore}%`;
            document.getElementById('experience-progress').style.width = `${data.experienceScore}%`;
            document.getElementById('experience-feedback').textContent = data.experienceFeedback;
            
            // Recommendations
            const recommendationsList = document.getElementById('recommendations-list');
            if (data.recommendations && data.recommendations.length > 0) {
                recommendationsList.innerHTML = data.recommendations
                    .map(rec => `<li class="flex items-start space-x-2">
                      <span class="text-orange-400 mt-1">•</span>
                      <span>${rec}</span>
                    </li>`)
                    .join('');
            } else {
                recommendationsList.innerHTML = '<li class="text-green-400 italic flex items-center"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Excellent! Your resume is well-optimized for this position.</li>';
            }
        }, 200);

        // Timestamp
        document.getElementById('resume-last-analyzed').textContent = new Date().toLocaleString();
    }

    resetResumeAnalysis() {
        this.uploadedResumeFile = null;
        this.uploadedJDFile = null;
        
        // Reset UI
        document.getElementById('resume-placeholder').classList.remove('hidden');
        document.getElementById('resume-progress-card').classList.add('hidden');
        
        // Reset upload buttons
        const resumeBtn = document.getElementById('resume-upload-button');
        const jdBtn = document.getElementById('jd-upload-button');
        
        resumeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Resume
        `;
        resumeBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        resumeBtn.classList.add('bg-primary-blue', 'hover:bg-blue-700');
        
        jdBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Job Description
        `;
        jdBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        jdBtn.classList.add('bg-primary-blue', 'hover:bg-blue-700');
        
        // Show notification
        this.showSuccessNotification('Ready for new analysis. Upload your files.');
    }

    // Interview Methods
    startInterview(type) {
        if (!this.currentUser) {
            alert('Please log in to start interview practice.');
            return;
        }
        
        this.interviewSystem.startInterview(type);
    }

    async handleVoiceRecording() {
        const recordBtn = document.getElementById('voice-record-btn');
        const recordBtnText = document.getElementById('record-btn-text');
        const textAnswer = document.getElementById('text-answer');
        
        if (!this.voice.isVoiceSupported()) {
            alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (this.voice.isCurrentlyListening()) {
            // Stop recording
            this.voice.stopListening();
            recordBtnText.textContent = 'Record Answer';
            recordBtn.classList.remove('bg-red-600', 'animate-pulse');
            recordBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        } else {
            // Start recording
            recordBtnText.textContent = 'Listening...';
            recordBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            recordBtn.classList.add('bg-red-600', 'animate-pulse');
            
            const success = await this.voice.startListening((result) => {
                if (result.error) {
                    console.error('Voice recognition error:', result.error);
                    alert(result.message || 'Speech recognition failed. Please try again.');
                    
                    // Reset button state
                    recordBtnText.textContent = 'Record Answer';
                    recordBtn.classList.remove('bg-red-600', 'animate-pulse');
                    recordBtn.classList.add('bg-red-500', 'hover:bg-red-600');
                } else {
                    // Update text area with transcript
                    if (result.transcript) {
                        textAnswer.value = result.transcript;
                        this.interviewSystem.updateAnswerWordCount();
                        this.interviewSystem.simulateRealTimeFeedback();
                    }
                    
                    // Auto-stop after final result
                    if (result.isFinal) {
                        setTimeout(() => {
                            this.voice.stopListening();
                            recordBtnText.textContent = 'Record Answer';
                            recordBtn.classList.remove('bg-red-600', 'animate-pulse');
                            recordBtn.classList.add('bg-red-500', 'hover:bg-red-600');
                        }, 1000);
                    }
                }
            });
            
            if (!success) {
                recordBtnText.textContent = 'Record Answer';
                recordBtn.classList.remove('bg-red-600', 'animate-pulse');
                recordBtn.classList.add('bg-red-500', 'hover:bg-red-600');
            }
        }
    }

    showTranscript() {
        if (window.interviewResults && window.interviewResults.answers) {
            let transcript = '# Interview Transcript\\n\\n';
            window.interviewResults.answers.forEach((answer, index) => {
                transcript += `## Question ${index + 1}\\n${answer.question}\\n\\n`;
                transcript += `**Your Answer:** ${answer.text || 'Skipped'}\\n\\n`;
                transcript += `**Response Time:** ${this.formatTime(answer.responseTime)}\\n\\n`;
                transcript += '---\\n\\n';
            });
            
            // Create a modal or new window to show transcript
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <html>
                    <head><title>Interview Transcript</title></head>
                    <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
                        <h1>JobSync Interview Transcript</h1>
                        <div style="white-space: pre-wrap;">${transcript.replace(/\\n/g, '<br>')}</div>
                    </body>
                </html>
            `);
        } else {
            alert('No transcript available.');
        }
    }

    async saveInterviewResults() {
        if (!this.currentUser) {
            alert('Please log in to save results.');
            return;
        }
        
        if (!window.interviewResults) {
            alert('No results to save.');
            return;
        }
        
        try {
            await this.db.saveInterviewResults(window.interviewResults);
            alert('Results saved successfully!');
        } catch (error) {
            console.error('Error saving results:', error);
            alert('Failed to save results. Please try again.');
        }
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // User Data Methods
    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            // Load latest resume analysis
            const latestAnalysis = await this.db.getLatestResumeAnalysis();
            if (latestAnalysis) {
                this.displayResumeResults(latestAnalysis);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    resetUserData() {
        this.resetResumeAnalysis();
        this.interviewSystem.resetInterview();
    }

    // Utility Methods
    showLoading(message = 'Processing...') {
        document.getElementById('loading-message').textContent = message;
        document.getElementById('global-loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('global-loading').style.display = 'none';
    }

    setupFAQAccordion() {
        const toggles = document.querySelectorAll('.faq-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetId = toggle.getAttribute('data-target');
                const content = document.getElementById(targetId);
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                const icon = toggle.querySelector('span');

                // Close all other open FAQs
                document.querySelectorAll('.faq-toggle[aria-expanded="true"]').forEach(openToggle => {
                    if (openToggle !== toggle) {
                        openToggle.setAttribute('aria-expanded', 'false');
                        const openContent = document.getElementById(openToggle.getAttribute('data-target'));
                        openContent.style.maxHeight = 0;
                        openToggle.querySelector('span').classList.remove('rotate-180');
                    }
                });

                // Toggle the clicked one
                if (isExpanded) {
                    toggle.setAttribute('aria-expanded', 'false');
                    content.style.maxHeight = 0;
                    icon.classList.remove('rotate-180');
                } else {
                    toggle.setAttribute('aria-expanded', 'true');
                    content.style.maxHeight = content.scrollHeight + 'px';
                    icon.classList.add('rotate-180');
                }
            });
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jobSyncApp = new JobSyncApp();
});

console.log('JobSync App loaded successfully!');