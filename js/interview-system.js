// Interview System Module
class InterviewSystem {
    constructor(database, voiceRecognition) {
        this.db = database;
        this.voice = voiceRecognition;
        this.questions = this.initializeQuestions();
        this.currentSession = null;
        this.setupEventListeners();
    }

    initializeQuestions() {
        return {
            behavioral: [
                "Tell me about a time when you had to work under pressure. How did you handle it?",
                "Describe a situation where you had to work with a difficult team member. What did you do?",
                "Give me an example of a goal you reached and tell me how you achieved it.",
                "Tell me about a time you failed. How did you deal with the situation?",
                "Describe a time when you had to learn something quickly. How did you approach it?"
            ],
            technical: [
                "Explain the difference between var, let, and const in JavaScript.",
                "How would you optimize a slow-running database query?",
                "Describe the concept of object-oriented programming and its main principles.",
                "What is the difference between synchronous and asynchronous programming?",
                "How would you approach debugging a complex software issue?"
            ],
            situational: [
                "You're assigned a project with a tight deadline but unclear requirements. How do you proceed?",
                "Your manager asks you to work on a project that conflicts with your values. What do you do?",
                "You notice a security vulnerability in your company's system. How do you handle it?",
                "A client is unhappy with the delivered product. How would you address this situation?",
                "You're leading a project and a team member consistently misses deadlines. What's your approach?"
            ],
            mixed: [] // Will be populated by combining all types
        };
    }

    generateMixedQuestions() {
        const all = [
            ...this.questions.behavioral.slice(0, 2),
            ...this.questions.technical.slice(0, 2),
            ...this.questions.situational.slice(0, 1)
        ];
        return this.shuffleArray(all);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    startInterview(type) {
        let questionSet;
        
        if (type === 'mixed') {
            questionSet = this.generateMixedQuestions();
        } else {
            questionSet = [...this.questions[type]];
        }

        this.currentSession = {
            type: type,
            questions: questionSet,
            currentQuestionIndex: 0,
            answers: [],
            startTime: new Date(),
            questionStartTime: new Date()
        };

        this.showInterviewInterface(type);
        this.displayCurrentQuestion();
        this.startTimer();
        
        return this.currentSession;
    }

    showInterviewInterface(type) {
        // Hide selection screen
        document.getElementById('interview-selection-screen').classList.add('hidden');
        // Show interview interface
        document.getElementById('interview-practice-interface').classList.remove('hidden');
        
        // Set interview type title
        const titles = {
            behavioral: 'Behavioral Interview',
            technical: 'Technical Interview', 
            situational: 'Situational Interview',
            mixed: 'Complete Interview Practice'
        };
        
        document.getElementById('interview-type-title').textContent = titles[type];
    }

    displayCurrentQuestion() {
        if (!this.currentSession) return;

        const { questions, currentQuestionIndex } = this.currentSession;
        const question = questions[currentQuestionIndex];
        
        // Update question text
        document.getElementById('current-question').textContent = question;
        
        // Update progress
        document.getElementById('interview-progress').textContent = 
            `Question ${currentQuestionIndex + 1} of ${questions.length}`;
        
        // Clear previous answer
        document.getElementById('text-answer').value = '';
        this.updateAnswerWordCount();
        
        // Reset feedback
        this.resetLiveFeedback();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Reset question start time
        this.currentSession.questionStartTime = new Date();
    }

    updateNavigationButtons() {
        const { currentQuestionIndex, questions } = this.currentSession;
        
        document.getElementById('prev-question-btn').disabled = currentQuestionIndex === 0;
        document.getElementById('next-question-btn').textContent = 
            currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question';
    }

    nextQuestion() {
        if (!this.currentSession) return;

        // Save current answer
        this.saveCurrentAnswer();

        const { currentQuestionIndex, questions } = this.currentSession;
        
        if (currentQuestionIndex < questions.length - 1) {
            this.currentSession.currentQuestionIndex++;
            this.displayCurrentQuestion();
        } else {
            this.completeInterview();
        }
    }

    prevQuestion() {
        if (!this.currentSession) return;
        
        // Save current answer
        this.saveCurrentAnswer();

        if (this.currentSession.currentQuestionIndex > 0) {
            this.currentSession.currentQuestionIndex--;
            this.displayCurrentQuestion();
            
            // Load previous answer if it exists
            const previousAnswer = this.currentSession.answers[this.currentSession.currentQuestionIndex];
            if (previousAnswer) {
                document.getElementById('text-answer').value = previousAnswer.text || '';
                this.updateAnswerWordCount();
            }
        }
    }

    skipQuestion() {
        this.saveCurrentAnswer('skipped');
        this.nextQuestion();
    }

    saveCurrentAnswer(status = 'answered') {
        if (!this.currentSession) return;

        const questionIndex = this.currentSession.currentQuestionIndex;
        const answerText = document.getElementById('text-answer').value;
        const endTime = new Date();
        const responseTime = endTime - this.currentSession.questionStartTime;

        const answer = {
            questionIndex: questionIndex,
            question: this.currentSession.questions[questionIndex],
            text: answerText,
            status: status,
            responseTime: responseTime,
            wordCount: answerText.trim().split(/\s+/).length,
            timestamp: endTime.toISOString()
        };

        // Update or add answer
        this.currentSession.answers[questionIndex] = answer;
    }

    async completeInterview() {
        if (!this.currentSession) return;

        // Save final answer
        this.saveCurrentAnswer();

        const endTime = new Date();
        const totalTime = endTime - this.currentSession.startTime;
        
        // Calculate results
        const results = this.calculateResults(this.currentSession, totalTime);
        
        // Save to database
        try {
            await this.db.saveInterviewResults(results);
            
            // Also save progress entry for tracking improvement over time
            await this.db.saveProgressEntry({
                interviewScore: results.scores.overall,
                resumeScore: 0, // Will be updated when resume is analyzed
                overallScore: results.scores.overall,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        } catch (error) {
            console.error('Failed to save interview results:', error);
        }

        // Show results
        this.showResults(results);
        
        // Store results globally for other components
        window.interviewResults = results;
    }

    calculateResults(session, totalTime) {
        const { answers, type, questions } = session;
        const answeredQuestions = answers.filter(a => a.status === 'answered' && a.text.trim().length > 0);
        
        // Calculate scores
        const clarityScore = this.calculateClarityScore(answeredQuestions);
        const structureScore = this.calculateStructureScore(answeredQuestions);
        const confidenceScore = this.calculateConfidenceScore(answeredQuestions);
        const overallScore = Math.round((clarityScore + structureScore + confidenceScore) / 3);
        
        return {
            type: type,
            totalQuestions: questions.length,
            answeredQuestions: answeredQuestions.length,
            skippedQuestions: questions.length - answeredQuestions.length,
            totalTime: totalTime,
            averageResponseTime: answeredQuestions.length > 0 ? 
                answeredQuestions.reduce((sum, a) => sum + a.responseTime, 0) / answeredQuestions.length : 0,
            scores: {
                overall: overallScore,
                clarity: clarityScore,
                structure: structureScore,
                confidence: confidenceScore
            },
            answers: answers,
            recommendations: this.generateRecommendations(overallScore, answeredQuestions),
            completedAt: new Date().toISOString()
        };
    }

    calculateClarityScore(answers) {
        if (answers.length === 0) return 0;
        
        let totalScore = 0;
        answers.forEach(answer => {
            const text = answer.text.trim();
            let score = 0;
            
            // Word count factor (optimal range: 50-200 words)
            if (answer.wordCount >= 50 && answer.wordCount <= 200) score += 30;
            else if (answer.wordCount >= 25 && answer.wordCount < 50) score += 20;
            else if (answer.wordCount > 200 && answer.wordCount <= 300) score += 25;
            else score += 10;
            
            // Grammar and structure (simple checks)
            if (text.includes('.') || text.includes('!') || text.includes('?')) score += 20;
            if (text.charAt(0) === text.charAt(0).toUpperCase()) score += 10;
            
            // Specific examples (looking for keywords)
            const exampleKeywords = ['for example', 'specifically', 'in particular', 'such as', 'like when'];
            if (exampleKeywords.some(keyword => text.toLowerCase().includes(keyword))) score += 20;
            
            // Professional language
            const professionalWords = ['implemented', 'developed', 'managed', 'achieved', 'collaborated', 'led'];
            const professionalCount = professionalWords.filter(word => 
                text.toLowerCase().includes(word)).length;
            score += Math.min(professionalCount * 5, 20);
            
            totalScore += Math.min(score, 100);
        });
        
        return Math.round(totalScore / answers.length);
    }

    calculateStructureScore(answers) {
        if (answers.length === 0) return 0;
        
        let totalScore = 0;
        answers.forEach(answer => {
            const text = answer.text.toLowerCase();
            let score = 0;
            
            // STAR method indicators
            const starIndicators = {
                situation: ['situation', 'when', 'during', 'at the time', 'context'],
                task: ['task', 'responsibility', 'goal', 'objective', 'needed to'],
                action: ['action', 'did', 'implemented', 'decided', 'approached', 'steps'],
                result: ['result', 'outcome', 'achieved', 'success', 'learned', 'impact']
            };
            
            let starScore = 0;
            Object.keys(starIndicators).forEach(component => {
                if (starIndicators[component].some(indicator => text.includes(indicator))) {
                    starScore += 25;
                }
            });
            
            score = starScore;
            totalScore += Math.min(score, 100);
        });
        
        return Math.round(totalScore / answers.length);
    }

    calculateConfidenceScore(answers) {
        if (answers.length === 0) return 0;
        
        let totalScore = 0;
        answers.forEach(answer => {
            let score = 0;
            const responseTime = answer.responseTime;
            const wordCount = answer.wordCount;
            
            // Response time (not too fast, not too slow)
            if (responseTime >= 10000 && responseTime <= 180000) score += 40; // 10s to 3min
            else if (responseTime < 10000) score += 20; // Too fast
            else score += 15; // Too slow
            
            // Confidence indicators in language
            const confidenceWords = ['confident', 'sure', 'definitely', 'successfully', 'effectively'];
            const hesitationWords = ['um', 'uh', 'maybe', 'i think', 'probably', 'i guess'];
            
            const confidenceCount = confidenceWords.filter(word => 
                answer.text.toLowerCase().includes(word)).length;
            const hesitationCount = hesitationWords.filter(word => 
                answer.text.toLowerCase().includes(word)).length;
            
            score += confidenceCount * 10 - hesitationCount * 5;
            
            // Length indicates thoroughness
            if (wordCount >= 30) score += 20;
            
            totalScore += Math.max(0, Math.min(score, 100));
        });
        
        return Math.round(totalScore / answers.length);
    }

    generateRecommendations(overallScore, answers) {
        const recommendations = [];
        
        if (overallScore < 60) {
            recommendations.push("Practice the STAR method (Situation, Task, Action, Result) for structured responses");
            recommendations.push("Prepare specific examples from your experience before the interview");
        }
        
        if (overallScore < 75) {
            recommendations.push("Work on providing more detailed explanations with concrete examples");
            recommendations.push("Practice speaking clearly and at an appropriate pace");
        }
        
        const avgWordCount = answers.reduce((sum, a) => sum + a.wordCount, 0) / answers.length;
        if (avgWordCount < 50) {
            recommendations.push("Provide more detailed responses - aim for 50-150 words per answer");
        } else if (avgWordCount > 200) {
            recommendations.push("Practice being more concise - aim to answer questions in 50-150 words");
        }
        
        const avgResponseTime = answers.reduce((sum, a) => sum + a.responseTime, 0) / answers.length;
        if (avgResponseTime < 10000) {
            recommendations.push("Take a moment to think before responding to show thoughtfulness");
        } else if (avgResponseTime > 180000) {
            recommendations.push("Practice your responses to reduce thinking time during interviews");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("Excellent performance! Continue practicing to maintain your skills");
            recommendations.push("Consider preparing for more advanced or role-specific questions");
        }
        
        return recommendations.slice(0, 4); // Limit to 4 recommendations
    }

    showResults(results) {
        // Hide interview interface
        document.getElementById('interview-practice-interface').classList.add('hidden');
        // Show results screen
        document.getElementById('interview-results-screen').classList.remove('hidden');
        
        // Update results display
        document.getElementById('final-score').textContent = `${results.scores.overall}%`;
        document.getElementById('final-progress-bar').style.width = `${results.scores.overall}%`;
        
        // Grade
        let grade = 'Needs Improvement';
        if (results.scores.overall >= 85) grade = 'Excellent Performance';
        else if (results.scores.overall >= 75) grade = 'Good Performance';
        else if (results.scores.overall >= 60) grade = 'Satisfactory Performance';
        
        document.getElementById('final-grade').textContent = grade;
        
        // Summary stats
        document.getElementById('total-time').textContent = this.formatTime(results.totalTime);
        document.getElementById('questions-answered').textContent = 
            `${results.answeredQuestions}/${results.totalQuestions}`;
        document.getElementById('avg-response-time').textContent = 
            this.formatTime(results.averageResponseTime);
        document.getElementById('interview-type-summary').textContent = 
            results.type.charAt(0).toUpperCase() + results.type.slice(1);
        
        // Detailed analysis
        this.showDetailedAnalysis(results);
    }

    showDetailedAnalysis(results) {
        const container = document.getElementById('detailed-analysis');
        
        const analysisHTML = `
            <div class="grid md:grid-cols-3 gap-6 mb-8">
                <div class="bg-primary-dark p-6 rounded-xl border border-white/10">
                    <h4 class="text-lg font-semibold text-green-400 mb-3">Clarity Score</h4>
                    <div class="text-3xl font-bold text-white mb-2">${results.scores.clarity}%</div>
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-green-400 h-2 rounded-full" style="width: ${results.scores.clarity}%"></div>
                    </div>
                </div>
                
                <div class="bg-primary-dark p-6 rounded-xl border border-white/10">
                    <h4 class="text-lg font-semibold text-blue-400 mb-3">Structure Score</h4>
                    <div class="text-3xl font-bold text-white mb-2">${results.scores.structure}%</div>
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-blue-400 h-2 rounded-full" style="width: ${results.scores.structure}%"></div>
                    </div>
                </div>
                
                <div class="bg-primary-dark p-6 rounded-xl border border-white/10">
                    <h4 class="text-lg font-semibold text-purple-400 mb-3">Confidence Score</h4>
                    <div class="text-3xl font-bold text-white mb-2">${results.scores.confidence}%</div>
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-purple-400 h-2 rounded-full" style="width: ${results.scores.confidence}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="bg-card-bg p-6 rounded-xl border border-white/10">
                <h4 class="text-xl font-bold text-orange-400 mb-4">Recommendations for Improvement</h4>
                <ul class="space-y-3">
                    ${results.recommendations.map(rec => `
                        <li class="flex items-start space-x-3 text-gray-300">
                            <span class="text-orange-400 mt-1">•</span>
                            <span>${rec}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        container.innerHTML = analysisHTML;
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    startTimer() {
        const timerElement = document.getElementById('interview-timer');
        const startTime = this.currentSession.startTime;
        
        const updateTimer = () => {
            if (!this.currentSession) return;
            
            const elapsed = new Date() - startTime;
            timerElement.textContent = this.formatTime(elapsed);
        };
        
        // Update immediately and then every second
        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    resetInterview() {
        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Reset session
        this.currentSession = null;
        
        // Show selection screen
        document.getElementById('interview-results-screen').classList.add('hidden');
        document.getElementById('interview-practice-interface').classList.add('hidden');
        document.getElementById('interview-selection-screen').classList.remove('hidden');
    }

    updateAnswerWordCount() {
        const text = document.getElementById('text-answer').value;
        const wordCount = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;
        document.getElementById('answer-word-count').textContent = `${wordCount} words`;
    }

    simulateRealTimeFeedback() {
        const text = document.getElementById('text-answer').value;
        const wordCount = text.trim().split(/\s+/).length;
        
        // Simple real-time feedback simulation
        let clarityScore = Math.min(Math.max(wordCount * 2, 10), 85) + Math.random() * 10;
        let structureScore = text.includes('.') ? 60 + Math.random() * 25 : 30 + Math.random() * 20;
        let confidenceScore = wordCount > 10 ? 50 + Math.random() * 30 : 20 + Math.random() * 20;
        
        // Update feedback bars
        document.getElementById('clarity-score').textContent = `${Math.round(clarityScore)}%`;
        document.getElementById('clarity-bar').style.width = `${clarityScore}%`;
        
        document.getElementById('structure-score').textContent = `${Math.round(structureScore)}%`;
        document.getElementById('structure-bar').style.width = `${structureScore}%`;
        
        document.getElementById('confidence-score').textContent = `${Math.round(confidenceScore)}%`;
        document.getElementById('confidence-bar').style.width = `${confidenceScore}%`;
    }

    resetLiveFeedback() {
        document.getElementById('clarity-score').textContent = '0%';
        document.getElementById('clarity-bar').style.width = '0%';
        document.getElementById('structure-score').textContent = '0%';
        document.getElementById('structure-bar').style.width = '0%';
        document.getElementById('confidence-score').textContent = '0%';
        document.getElementById('confidence-bar').style.width = '0%';
    }

    setupEventListeners() {
        // These will be called from the main app
    }
}

// Export for use in other files
window.InterviewSystem = InterviewSystem;