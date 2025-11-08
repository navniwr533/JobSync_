class DashboardVisualization {
  constructor() {
    this.charts = {};
    this.skillGapData = null;
    this.progressData = null;
    this.hasAnalysisData = false;
  }

  // Initialize all dashboard charts
  async initializeDashboard() {
    this.createReadinessScoreChart();
    this.createSkillGapHeatmap();
    this.createProgressOverTimeChart();
    this.renderRoadmap(); // Render the skill development roadmap
  }

  // Create Readiness Score Gauge Chart (as shown in PPT)
  createReadinessScoreChart() {
    const ctx = document.getElementById('readinessScoreChart');
    if (!ctx) return;

    // Get user's current readiness score
    const readinessScore = this.getUserReadinessScore();
    
    this.charts.readinessScore = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Ready', 'Gap Remaining'],
        datasets: [{
          data: [readinessScore, 100 - readinessScore],
          backgroundColor: ['#14B8A6', '#EF4444'],
          borderWidth: 0,
          cutout: '80%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
      },
      plugins: [{
        id: 'centerText',
        afterDraw: (chart) => {
          const { width, height, ctx } = chart;
          ctx.restore();
          ctx.font = '2rem bold Inter';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#14B8A6';
          ctx.fillText(`${readinessScore}%`, width / 2, height / 2 - 10);
          ctx.font = '0.875rem Inter';
          ctx.fillStyle = '#6B7280';
          ctx.fillText('Job Ready', width / 2, height / 2 + 20);
          ctx.save();
        }
      }]
    });
  }

  // Create Skill Gap Heatmap (matching PPT design)
  createSkillGapHeatmap() {
    const ctx = document.getElementById('skillGapChart');
    if (!ctx) return;

    if (this.charts.skillGap) {
      this.charts.skillGap.destroy();
      this.charts.skillGap = null;
    }

    const skillGaps = this.analyzeSkillGaps();
    this.skillGapData = skillGaps;

    const priorityLabel = document.getElementById('critical-skill-count');
    if (priorityLabel) {
      const criticalCount = skillGaps.filter(skill => skill.gap >= 40).length;
      priorityLabel.textContent = criticalCount > 0 ? `${criticalCount} Critical` : 'No Critical Gaps';
    }

    // If no data, show empty state
    if (skillGaps.length === 0) {
      const canvas = ctx;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#6B7280';
      context.font = '14px Inter';
      context.textAlign = 'center';
      context.fillText('No data available. Upload your resume and job description.', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    this.charts.skillGap = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: skillGaps.map(skill => skill.name),
        datasets: [
          {
            label: 'Current Level',
            data: skillGaps.map(skill => skill.current),
            backgroundColor: '#3B82F6',
            borderRadius: 4
          },
          {
            label: 'Required Level',
            data: skillGaps.map(skill => skill.required),
            backgroundColor: '#EF4444',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#E5E7EB',
              font: { family: 'Inter' }
            }
          },
          title: {
            display: true,
            text: 'Skill Gap Analysis',
            color: '#E5E7EB',
            font: { size: 16, family: 'Inter', weight: 'bold' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9CA3AF' },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#9CA3AF' },
            grid: { color: 'rgba(156, 163, 175, 0.1)' },
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  // Create Progress Over Time Chart (PPT requirement)
  createProgressOverTimeChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    const progressData = this.getProgressOverTime();
    
    // If no data, show empty state
    if (progressData.dates.length === 0) {
      const canvas = ctx;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#6B7280';
      context.font = '14px Inter';
      context.textAlign = 'center';
      context.fillText('No progress data yet. Start practicing to track your improvement!', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    this.charts.progress = new Chart(ctx, {
      type: 'line',
      data: {
        labels: progressData.dates,
        datasets: [
          {
            label: 'Resume Score',
            data: progressData.resumeScores,
            borderColor: '#14B8A6',
            backgroundColor: 'rgba(20, 184, 166, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Interview Score',
            data: progressData.interviewScores,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Overall Readiness',
            data: progressData.overallReadiness,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#E5E7EB',
              font: { family: 'Inter' }
            }
          },
          title: {
            display: true,
            text: 'Progress Tracking Over Time',
            color: '#E5E7EB',
            font: { size: 16, family: 'Inter', weight: 'bold' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9CA3AF' },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#9CA3AF' },
            grid: { color: 'rgba(156, 163, 175, 0.1)' },
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  // Analyze skill gaps based on resume and job requirements
  analyzeSkillGaps() {
    const database = new LocalDatabase();
    const latestAnalysis = database.getLatestResumeAnalysis();
    this.hasAnalysisData = !!latestAnalysis;
    
    // Only return skill gaps if user has uploaded resume and JD
    if (latestAnalysis && latestAnalysis.skillGaps) {
      return latestAnalysis.skillGaps.sort((a, b) => b.gap - a.gap);
    }
    
    // Return empty array if no analysis available
    return [];
  }

  // Get user's current readiness score
  getUserReadinessScore() {
    const database = new LocalDatabase();
    const latestAnalysis = database.getLatestResumeAnalysis();
    
    if (latestAnalysis) {
      return latestAnalysis.overallScore || 0;
    }
    
    // Return 0 if no data - DO NOT show fake data
    return 0;
  }

  // Get progress data over time
  getProgressOverTime() {
    const database = new LocalDatabase();
    const userProgress = database.getUserProgress();
    
    // If we have real user data, use it
    if (userProgress && userProgress.length > 0) {
      const dates = userProgress.map(p => p.date);
      const resumeScores = userProgress.map(p => p.resumeScore || 0);
      const interviewScores = userProgress.map(p => p.interviewScore || 0);
      const overallReadiness = userProgress.map(p => p.overallScore || 0);
      
      return { dates, resumeScores, interviewScores, overallReadiness };
    }
    
    // Return empty data if no user progress
    return {
      dates: [],
      resumeScores: [],
      interviewScores: [],
      overallReadiness: []
    };
  }

  // Generate skill development roadmap
  generateSkillRoadmap() {
    const skillGaps = this.skillGapData !== null ? this.skillGapData : this.analyzeSkillGaps();
    const roadmap = [];
    
    // Only generate roadmap if we have actual skill gap data
    if (skillGaps.length === 0) {
      return roadmap;
    }
    
    skillGaps.forEach((skill, index) => {
      if (skill.gap > 20) {
        roadmap.push({
          skill: skill.name,
          gap: skill.gap,
          priority: skill.gap > 40 ? 'High' : 'Medium',
          timeframe: skill.gap > 40 ? '2-3 months' : '1-2 months',
          resources: this.getSkillResources(skill.name),
          milestones: this.getSkillMilestones(skill.name, skill.gap),
          order: roadmap.length + 1
        });
      }
    });
    
    return roadmap;
  }

  // Render roadmap in the UI
  renderRoadmap() {
    const roadmap = this.generateSkillRoadmap();
    const roadmapContainer = document.getElementById('skillRoadmap');
    
    if (!roadmapContainer) return 'no-data';

  const hasAnalysis = this.hasAnalysisData;
    
    if (roadmap.length === 0) {
      roadmapContainer.innerHTML = hasAnalysis
        ? `
          <div class="text-center py-12 text-green-300/80">
            <svg class="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm">Great work! Your resume already covers the critical skills for this role.</p>
          </div>
        `
        : `
          <div class="text-center py-12 text-gray-400">
            <svg class="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm">Upload your resume and job description to generate a personalized learning roadmap</p>
          </div>
        `;
      return hasAnalysis ? 'covered' : 'no-data';
    }
    
    const priorityColors = {
      'High': { bg: 'bg-red-500', text: 'text-red-500' },
      'Medium': { bg: 'bg-orange-500', text: 'text-orange-500' }
    };
    
    const roadmapHTML = roadmap.map(item => {
      const colors = priorityColors[item.priority];
      return `
        <div class="flex items-center space-x-6 p-4 bg-card-bg rounded-lg border border-white/5">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center">
              <span class="text-white font-bold">${item.order}</span>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-semibold text-white">${item.skill}</h4>
              <span class="text-xs ${colors.bg} text-white px-2 py-1 rounded-full">${item.priority} Priority</span>
            </div>
            <p class="text-sm text-gray-400 mb-2">Bridge ${item.gap}% skill gap • ${item.timeframe} timeline</p>
            <div class="flex flex-wrap gap-2">
              ${item.resources.map(resource => `
                <span class="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">${resource}</span>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    roadmapContainer.innerHTML = roadmapHTML;
    return 'generated';
  }

  // Get learning resources for specific skills
  getSkillResources(skillName) {
    const resources = {
      'React.js': ['React Official Docs', 'Full Stack Open', 'React Projects on GitHub'],
      'Node.js': ['Node.js Documentation', 'Express.js Tutorial', 'Backend Projects'],
      'MongoDB': ['MongoDB University', 'Mongoose Documentation', 'Database Design Course'],
      'Problem Solving': ['LeetCode', 'HackerRank', 'Daily Coding Challenges'],
      'Team Leadership': ['Leadership Courses', 'Team Management Books', 'Leadership Workshops'],
      'Communication': ['Presentation Skills Course', 'Technical Writing', 'Public Speaking Practice']
    };
    
    return resources[skillName] || ['Online Courses', 'Practice Projects', 'Industry Resources'];
  }

  // Get skill development milestones
  getSkillMilestones(skillName, gap) {
    const milestones = [];
    const steps = Math.ceil(gap / 20);
    
    for (let i = 1; i <= steps; i++) {
      milestones.push({
        week: i * 2,
        target: `${skillName} - Level ${i}`,
        description: `Complete foundational concepts and practical exercises`
      });
    }
    
    return milestones;
  }

  // Update charts with new data
  updateCharts(newData) {
    Object.keys(this.charts).forEach(chartKey => {
      if (this.charts[chartKey] && newData[chartKey]) {
        this.charts[chartKey].data = newData[chartKey];
        this.charts[chartKey].update();
      }
    });
  }

  // Destroy all charts (cleanup)
  destroyCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};
    this.skillGapData = null;
    this.hasAnalysisData = false;
  }
}