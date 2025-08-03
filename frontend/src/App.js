import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API}/auth/login`, credentials);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(access_token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(access_token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Component
const Login = () => {
  const [credentials, setCredentials] = useState({ username_or_email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(credentials);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            نظام إدارة أعمال البناء والشوارع
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <input
              type="text"
              required
              value={credentials.username_or_email}
              onChange={(e) => setCredentials({...credentials, username_or_email: e.target.value})}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="أدخل كلمة المرور"
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Register Component
const Register = () => {
  const [userData, setUserData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    company_name: '',
    company_number: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await register(userData);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            تسجيل مستخدم جديد
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">الاسم الكامل</label>
              <input
                type="text"
                required
                value={userData.full_name}
                onChange={(e) => setUserData({...userData, full_name: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
              <input
                type="tel"
                required
                value={userData.phone_number}
                onChange={(e) => setUserData({...userData, phone_number: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني (اختياري)</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">اسم الشركة</label>
              <input
                type="text"
                required
                value={userData.company_name}
                onChange={(e) => setUserData({...userData, company_name: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">رقم الشركة (ח.פ.)</label>
              <input
                type="text"
                required
                value={userData.company_number}
                onChange={(e) => setUserData({...userData, company_number: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">اسم المستخدم</label>
              <input
                type="text"
                required
                value={userData.username}
                onChange={(e) => setUserData({...userData, username: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">كلمة المرور</label>
              <input
                type="password"
                required
                value={userData.password}
                onChange={(e) => setUserData({...userData, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? 'جاري التسجيل...' : 'تسجيل حساب جديد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [financialReport, setFinancialReport] = useState(null);
  const [projectsFinancial, setProjectsFinancial] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    fetchProjects();
    fetchFinancialReport();
    fetchProjectsFinancial();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchFinancialReport = async (period = null, projectId = null) => {
    try {
      let url = `${API}/reports/financial`;
      const params = [];
      if (period && period !== 'all') params.push(`period=${period}`);
      if (projectId && projectId !== 'all') params.push(`project_id=${projectId}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const response = await axios.get(url);
      setFinancialReport(response.data);
    } catch (error) {
      console.error('Error fetching financial report:', error);
    }
  };

  const fetchProjectsFinancial = async () => {
    try {
      const response = await axios.get(`${API}/reports/projects`);
      setProjectsFinancial(response.data);
    } catch (error) {
      console.error('Error fetching projects financial:', error);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    fetchFinancialReport(period === 'all' ? null : period, selectedProject === 'all' ? null : selectedProject);
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    fetchFinancialReport(selectedPeriod === 'all' ? null : selectedPeriod, projectId === 'all' ? null : projectId);
  };

  const MenuItem = ({ title, onClick, icon, isActive }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
        isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-lg">{icon}</span>
        <span className="font-medium">{title}</span>
      </div>
    </button>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Financial Filter Controls */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">فلترة التقارير المالية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">جميع الفترات</option>
                    <option value="monthly">الشهر الحالي</option>
                    <option value="yearly">السنة الحالية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المشروع</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">جميع المشاريع</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">عدد المشاريع النشطة</h3>
                <p className="text-3xl font-bold text-blue-600">{projects.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">إجمالي المدخولات</h3>
                <p className="text-3xl font-bold text-green-600">
                  {financialReport ? `₪${financialReport.total_incomes.toLocaleString()}` : 'جاري التحميل...'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">إجمالي المصروفات</h3>
                <p className="text-3xl font-bold text-red-600">
                  {financialReport ? `₪${financialReport.total_expenses.toLocaleString()}` : 'جاري التحميل...'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">الأرباح الصافية</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {financialReport ? `₪${financialReport.profit.toLocaleString()}` : 'جاري التحميل...'}
                </p>
              </div>
            </div>
            
            {/* Projects Financial Summary */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص المشاريع المالي</h3>
              <div className="space-y-4">
                {projectsFinancial.map(project => (
                  <div key={project.project_id} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                       onClick={() => setCurrentView(`project-details-${project.project_id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{project.project_name}</h4>
                      <span className={`text-sm px-2 py-1 rounded ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' : 
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {project.status === 'active' ? 'نشط' : 
                         project.status === 'completed' ? 'مكتمل' : 'ملغي'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">المبلغ الإجمالي:</span>
                        <span className="text-blue-600 ml-2">₪{project.total_amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">المدخولات:</span>
                        <span className="text-green-600 ml-2">₪{project.total_incomes.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">المصروفات:</span>
                        <span className="text-red-600 ml-2">₪{project.total_expenses.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">الربح:</span>
                        <span className={`ml-2 ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₪{project.profit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">التقدم: {project.progress_percentage.toFixed(1)}%</span>
                      <span className="text-sm text-blue-600">انقر لعرض التفاصيل</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${project.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'projects':
        return <ProjectManagement onProjectsChange={fetchProjects} />;
      case 'workers':
        return <WorkerManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'incomes':
        return <IncomeManagement />;
      case 'workdays':
        return <WorkDayManagement projects={projects} />;
      default:
        // Check if it's a project details view
        if (currentView.startsWith('project-details-')) {
          const projectId = currentView.replace('project-details-', '');
          const project = projects.find(p => p.id === projectId);
          if (project) {
            return <ProjectDetailsView project={project} onBack={() => setCurrentView('dashboard')} />;
          }
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">نظام إدارة أعمال البناء</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">مرحباً، {user.full_name}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-md p-4">
            <nav className="space-y-2">
              <MenuItem 
                title="الصفحة الرئيسية" 
                onClick={() => setCurrentView('dashboard')}
                icon="🏠"
                isActive={currentView === 'dashboard'}
              />
              <MenuItem 
                title="المشاريع" 
                onClick={() => setCurrentView('projects')}
                icon="🏗️"
                isActive={currentView === 'projects'}
              />
              <MenuItem 
                title="العمال" 
                onClick={() => setCurrentView('workers')}
                icon="👷"
                isActive={currentView === 'workers'}
              />
              <MenuItem 
                title="المصروفات" 
                onClick={() => setCurrentView('expenses')}
                icon="💰"
                isActive={currentView === 'expenses'}
              />
              <MenuItem 
                title="المدخولات" 
                onClick={() => setCurrentView('incomes')}
                icon="💵"
                isActive={currentView === 'incomes'}
              />
              <MenuItem 
                title="أيام العمل" 
                onClick={() => setCurrentView('workdays')}
                icon="📅"
                isActive={currentView === 'workdays'}
              />
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Project Management Component
const ProjectManagement = ({ onProjectsChange }) => {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'building',
    work_sections: [],
    work_additions: [],
    floors_count: 1,
    street_length: 0,
    address: '',
    contact_phone1: '',
    contact_phone2: '',
    total_amount: '',
    building_config: {},
    street_config: {}
  });
  const [workSections, setWorkSections] = useState([{ name: '', percentage: 0 }]);
  const [workAdditions, setWorkAdditions] = useState([{ name: '', percentage: 0 }]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
      onProjectsChange();
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const addWorkSection = () => {
    setWorkSections([...workSections, { name: '', percentage: 0 }]);
  };

  const removeWorkSection = (index) => {
    const newSections = workSections.filter((_, i) => i !== index);
    setWorkSections(newSections);
  };

  const updateWorkSection = (index, field, value) => {
    const newSections = [...workSections];
    newSections[index][field] = field === 'percentage' ? parseFloat(value) || 0 : value;
    setWorkSections(newSections);
  };

  const addWorkAddition = () => {
    setWorkAdditions([...workAdditions, { name: '', percentage: 0 }]);
  };

  const removeWorkAddition = (index) => {
    const newAdditions = workAdditions.filter((_, i) => i !== index);
    setWorkAdditions(newAdditions);
  };

  const updateWorkAddition = (index, field, value) => {
    const newAdditions = [...workAdditions];
    newAdditions[index][field] = field === 'percentage' ? parseFloat(value) || 0 : value;
    setWorkAdditions(newAdditions);
  };

  const getTotalPercentage = () => {
    const sectionsTotal = workSections.reduce((total, section) => total + section.percentage, 0);
    const additionsTotal = workAdditions.reduce((total, addition) => total + addition.percentage, 0);
    return sectionsTotal + additionsTotal;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    console.log('Work sections:', workSections);
    console.log('Work additions:', workAdditions);
    
    const totalPercentage = getTotalPercentage();
    console.log('Total percentage:', totalPercentage);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert(`يجب أن يكون إجمالي نسب أقسام العمل والإضافات 100%. النسبة الحالية: ${totalPercentage}%`);
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      alert('اسم المشروع مطلوب');
      return;
    }
    
    if (!formData.address.trim()) {
      alert('العنوان مطلوب');
      return;
    }
    
    if (!formData.contact_phone1.trim()) {
      alert('رقم الهاتف الأول مطلوب');
      return;
    }
    
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      alert('المبلغ الإجمالي مطلوب ويجب أن يكون أكبر من صفر');
      return;
    }
    
    if (formData.type === 'building' && (!formData.floors_count || parseInt(formData.floors_count) < 1)) {
      alert('عدد الطبقات مطلوب للمباني ويجب أن يكون أكبر من صفر');
      return;
    }
    
    if (formData.type === 'street' && (!formData.street_length || parseFloat(formData.street_length) <= 0)) {
      alert('عدد الأمتار مطلوب للشوارع ويجب أن يكون أكبر من صفر');
      return;
    }

    try {
      console.log('Preparing submit data...');
      
      const filteredWorkSections = workSections.filter(section => section.name.trim() !== '');
      const filteredWorkAdditions = workAdditions.filter(addition => addition.name.trim() !== '');
      
      if (filteredWorkSections.length === 0 && filteredWorkAdditions.length === 0) {
        alert('يجب إضافة قسم عمل واحد على الأقل');
        return;
      }
      
      const submitData = {
        name: formData.name.trim(),
        type: formData.type,
        work_sections: filteredWorkSections,
        work_additions: filteredWorkAdditions,
        floors_count: formData.type === 'building' ? parseInt(formData.floors_count) : null,
        street_length: formData.type === 'street' ? parseFloat(formData.street_length) : null,
        address: formData.address.trim(),
        contact_phone1: formData.contact_phone1.trim(),
        contact_phone2: formData.contact_phone2 ? formData.contact_phone2.trim() : null,
        total_amount: parseFloat(formData.total_amount),
        building_config: {},
        street_config: {}
      };

      console.log('Submit data:', submitData);
      
      const response = await axios.post(`${API}/projects`, submitData);
      console.log('Project created successfully:', response.data);
      
      alert('تم حفظ المشروع بنجاح!');
      setShowForm(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`حدث خطأ أثناء إنشاء المشروع: ${error.response.data.detail || 'خطأ غير معروف'}`);
      } else {
        alert('حدث خطأ أثناء إنشاء المشروع. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'building',
      work_sections: [],
      work_additions: [],
      floors_count: 1,
      street_length: 0,
      address: '',
      contact_phone1: '',
      contact_phone2: '',
      total_amount: '',
      building_config: {},
      street_config: {}
    });
    setWorkSections([{ name: '', percentage: 0 }]);
    setWorkAdditions([{ name: '', percentage: 0 }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة المشاريع</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          إضافة مشروع جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">إضافة مشروع جديد</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">اسم المشروع</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">نوع المشروع</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="building">بناء</option>
                  <option value="street">شارع</option>
                </select>
              </div>
              
              {formData.type === 'building' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">عدد الطبقات</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.floors_count}
                    onChange={(e) => setFormData({...formData, floors_count: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">عدد الأمتار</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={formData.street_length}
                    onChange={(e) => setFormData({...formData, street_length: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">العنوان</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">رقم الهاتف الأول</label>
                <input
                  type="tel"
                  required
                  value={formData.contact_phone1}
                  onChange={(e) => setFormData({...formData, contact_phone1: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">رقم الهاتف الثاني (اختياري)</label>
                <input
                  type="tel"
                  value={formData.contact_phone2}
                  onChange={(e) => setFormData({...formData, contact_phone2: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">المبلغ الإجمالي</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Work Sections */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-medium text-gray-900">أقسام العمل</h4>
                <button
                  type="button"
                  onClick={addWorkSection}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                >
                  إضافة قسم
                </button>
              </div>
              
              {workSections.map((section, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="اسم القسم"
                      value={section.name}
                      onChange={(e) => updateWorkSection(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="النسبة %"
                      min="0"
                      max="100"
                      value={section.percentage}
                      onChange={(e) => updateWorkSection(index, 'percentage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  {workSections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWorkSection(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700"
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Work Additions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-medium text-gray-900">إضافات العمل (أسوار، طبقات سفلية، أسقف)</h4>
                <button
                  type="button"
                  onClick={addWorkAddition}
                  className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700"
                >
                  إضافة إضافة
                </button>
              </div>
              
              {workAdditions.map((addition, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="اسم الإضافة (مثال: أسوار، طبقات سفلية)"
                      value={addition.name}
                      onChange={(e) => updateWorkAddition(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="النسبة %"
                      min="0"
                      max="100"
                      value={addition.percentage}
                      onChange={(e) => updateWorkAddition(index, 'percentage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWorkAddition(index)}
                    className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              إجمالي النسب: {getTotalPercentage()}% 
              {getTotalPercentage() !== 100 && (
                <span className="text-red-600 mr-2">
                  (يجب أن يكون 100%)
                </span>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                حفظ المشروع
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">قائمة المشاريع</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {projects.map(project => (
            <div key={project.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-500">{project.type === 'building' ? 'بناء' : 'شارع'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-green-600">₪{project.total_amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">التقدم: {project.progress_percentage}%</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="font-medium text-gray-700">
                    {project.type === 'building' ? 'عدد الطبقات:' : 'عدد الأمتار:'}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {project.type === 'building' ? project.floors_count : project.street_length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">العنوان:</span>
                  <span className="text-gray-600 ml-2">{project.address}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">الهاتف:</span>
                  <span className="text-gray-600 ml-2">{project.contact_phone1}</span>
                </div>
              </div>

              {/* Work Sections */}
              {project.work_sections && project.work_sections.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">أقسام العمل:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {project.work_sections.map((section, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{section.name}</span>
                        <span className="text-sm font-medium text-blue-600">{section.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Additions */}
              {project.work_additions && project.work_additions.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">إضافات العمل:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {project.work_additions.map((addition, index) => (
                      <div key={index} className="flex justify-between items-center bg-purple-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{addition.name}</span>
                        <span className="text-sm font-medium text-purple-600">{addition.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${project.progress_percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Worker Management Component
const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    id_number: '',
    payment_type: 'daily',
    payment_amount: ''
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await axios.get(`${API}/workers`);
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/workers`, {
        ...formData,
        payment_amount: parseFloat(formData.payment_amount)
      });
      setShowForm(false);
      setFormData({
        name: '',
        id_number: '',
        payment_type: 'daily',
        payment_amount: ''
      });
      fetchWorkers();
    } catch (error) {
      console.error('Error creating worker:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة العمال</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          إضافة عامل جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">إضافة عامل جديد</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">اسم العامل</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">رقم الهوية (اختياري)</label>
                <input
                  type="text"
                  value={formData.id_number}
                  onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">نوع الدفع</label>
                <select
                  value={formData.payment_type}
                  onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="hourly">ساعي</option>
                  <option value="daily">يومي</option>
                  <option value="monthly">شهري</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">المبلغ</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.payment_amount}
                  onChange={(e) => setFormData({...formData, payment_amount: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                حفظ العامل
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">قائمة العمال</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {workers.map(worker => (
            <div key={worker.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{worker.name}</h4>
                  {worker.id_number && (
                    <p className="text-sm text-gray-500">رقم الهوية: {worker.id_number}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-green-600">
                    ₪{worker.payment_amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {worker.payment_type === 'hourly' ? 'ساعي' : 
                     worker.payment_type === 'daily' ? 'يومي' : 'شهري'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Expense Management Component
const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    type: 'equipment',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchProjects();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses`);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, {
        ...formData,
        amount: parseFloat(formData.amount),
        project_id: formData.project_id || null
      });
      setShowForm(false);
      setFormData({
        project_id: '',
        type: 'equipment',
        amount: '',
        description: ''
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      equipment: 'عتاد',
      fuel: 'بنزين',
      gifts: 'هدايا',
      vehicle: 'سيارة',
      office: 'مكتب'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة المصروفات</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          إضافة مصروف جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">إضافة مصروف جديد</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">المشروع (اختياري)</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                >
                  <option value="">اختر المشروع</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">نوع المصروف</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                >
                  <option value="equipment">عتاد</option>
                  <option value="fuel">بنزين</option>
                  <option value="gifts">هدايا</option>
                  <option value="vehicle">سيارة</option>
                  <option value="office">مكتب</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">المبلغ</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">الوصف (اختياري)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                حفظ المصروف
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">قائمة المصروفات</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {expenses.map(expense => (
            <div key={expense.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{getTypeLabel(expense.type)}</h4>
                  {expense.description && (
                    <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(expense.date).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-red-600">₪{expense.amount.toLocaleString()}</p>
                  {expense.project_id && (
                    <p className="text-sm text-gray-500">
                      {projects.find(p => p.id === expense.project_id)?.name || 'مشروع محذوف'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Income Management Component
const IncomeManagement = () => {
  const [incomes, setIncomes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    amount_with_tax: '',
    tax_percentage: 17,
    description: ''
  });

  useEffect(() => {
    fetchIncomes();
    fetchProjects();
  }, []);

  const fetchIncomes = async () => {
    try {
      const response = await axios.get(`${API}/incomes`);
      setIncomes(response.data);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const calculateAmountBeforeTax = () => {
    const amountWithTax = parseFloat(formData.amount_with_tax) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;
    return amountWithTax / (1 + taxPercentage / 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/incomes`, {
        ...formData,
        amount_with_tax: parseFloat(formData.amount_with_tax),
        tax_percentage: parseFloat(formData.tax_percentage)
      });
      setShowForm(false);
      setFormData({
        project_id: '',
        amount_with_tax: '',
        tax_percentage: 17,
        description: ''
      });
      fetchIncomes();
    } catch (error) {
      console.error('Error creating income:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة المدخولات</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          إضافة مدخول جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">إضافة مدخول جديد</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">المشروع</label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">اختر المشروع</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">المبلغ شامل الضريبة</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount_with_tax}
                  onChange={(e) => setFormData({...formData, amount_with_tax: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">نسبة الضريبة المضافة (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({...formData, tax_percentage: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">المبلغ دون الضريبة (محسوب تلقائياً)</label>
                <input
                  type="number"
                  step="0.01"
                  value={calculateAmountBeforeTax().toFixed(2)}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">الوصف (اختياري)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                حفظ المدخول
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">قائمة المدخولات</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {incomes.map(income => (
            <div key={income.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {projects.find(p => p.id === income.project_id)?.name || 'مشروع محذوف'}
                  </h4>
                  {income.description && (
                    <p className="text-sm text-gray-600 mt-1">{income.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(income.date).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-green-600">
                    ₪{income.amount_with_tax?.toLocaleString()} شامل الضريبة
                  </p>
                  <p className="text-sm text-gray-500">
                    ₪{income.amount_before_tax?.toLocaleString()} دون الضريبة
                  </p>
                  <p className="text-xs text-gray-400">
                    ضريبة {income.tax_percentage}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Project Details View Component
const ProjectDetailsView = ({ project, onBack }) => {
  const [workdays, setWorkdays] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjectWorkdays();
    fetchWorkers();
  }, [project.id]);

  const fetchProjectWorkdays = async () => {
    try {
      const response = await axios.get(`${API}/workdays/project/${project.id}`);
      setWorkdays(response.data);
    } catch (error) {
      console.error('Error fetching project workdays:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await axios.get(`${API}/workers`);
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            ← العودة
          </button>
          <h2 className="text-2xl font-bold text-gray-900">تفاصيل المشروع</h2>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{project.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <span className="font-medium text-gray-700">نوع المشروع:</span>
            <span className="text-gray-600 ml-2">{project.type === 'building' ? 'بناء' : 'شارع'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">
              {project.type === 'building' ? 'عدد الطبقات:' : 'عدد الأمتار:'}
            </span>
            <span className="text-gray-600 ml-2">
              {project.type === 'building' ? project.floors_count : project.street_length}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">العنوان:</span>
            <span className="text-gray-600 ml-2">{project.address}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">الهاتف:</span>
            <span className="text-gray-600 ml-2">{project.contact_phone1}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">المبلغ الإجمالي:</span>
            <span className="text-blue-600 ml-2">₪{project.total_amount.toLocaleString()}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">التقدم:</span>
            <span className="text-green-600 ml-2">{project.progress_percentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
            style={{ width: `${project.progress_percentage}%` }}
          ></div>
        </div>

        {/* Work Sections */}
        {project.work_sections && project.work_sections.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">أقسام العمل:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {project.work_sections.map((section, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span className="text-sm text-gray-700">{section.name}</span>
                  <span className="text-sm font-medium text-blue-600">{section.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Additions */}
        {project.work_additions && project.work_additions.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">إضافات العمل:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {project.work_additions.map((addition, index) => (
                <div key={index} className="flex justify-between items-center bg-purple-50 p-3 rounded">
                  <span className="text-sm text-gray-700">{addition.name}</span>
                  <span className="text-sm font-medium text-purple-600">{addition.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Work Days */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">أيام العمل في هذا المشروع</h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل أيام العمل...</p>
          </div>
        ) : workdays.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">لا توجد أيام عمل مسجلة لهذا المشروع بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workdays.map(workday => (
              <div key={workday.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {workday.work_section} - {workday.work_area}
                    </h4>
                    {workday.floor_number && (
                      <p className="text-sm text-gray-600">الطبقة {workday.floor_number}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {workday.work_percentage}% مكتمل
                    </p>
                    <p className="text-sm text-gray-500">
                      {workday.work_date}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">العمال:</h5>
                    <div className="flex flex-wrap gap-2">
                      {workday.workers.map(workerId => {
                        const worker = workers.find(w => w.id === workerId);
                        return worker ? (
                          <span key={workerId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {worker.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  
                  <div>
                    {workday.vehicle_used && (
                      <div className="mb-2">
                        <h5 className="text-sm font-medium text-gray-700">السيارة المستخدمة:</h5>
                        <p className="text-sm text-gray-600">{workday.vehicle_used}</p>
                      </div>
                    )}
                    
                    {workday.notes && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">الملاحظات:</h5>
                        <p className="text-sm text-gray-600">{workday.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
const WorkDayManagement = ({ projects }) => {
  const [workdays, setWorkdays] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkday, setEditingWorkday] = useState(null);
  const [formData, setFormData] = useState({
    project_id: '',
    work_section: '',
    work_area: '',
    floor_number: null,
    work_percentage: 0,
    workers: [],
    vehicle_used: '',
    notes: '',
    work_date: new Date().toISOString().split('T')[0] // Today's date
  });
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchWorkdays();
    fetchWorkers();
  }, []);

  const fetchWorkdays = async () => {
    try {
      const response = await axios.get(`${API}/workdays`);
      setWorkdays(response.data);
    } catch (error) {
      console.error('Error fetching workdays:', error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await axios.get(`${API}/workers`);
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    setFormData({
      ...formData, 
      project_id: projectId, 
      work_section: '', 
      work_area: '',
      floor_number: null
    });
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
  };

  const getAllWorkItems = () => {
    if (!selectedProject) return [];
    
    const workItems = [];
    
    // Add work sections
    if (selectedProject.work_sections) {
      selectedProject.work_sections.forEach(section => {
        workItems.push({
          name: section.name,
          type: 'section',
          percentage: section.percentage
        });
      });
    }
    
    // Add work additions
    if (selectedProject.work_additions) {
      selectedProject.work_additions.forEach(addition => {
        workItems.push({
          name: addition.name,
          type: 'addition',
          percentage: addition.percentage
        });
      });
    }
    
    return workItems;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        floor_number: selectedProject?.type === 'building' ? parseInt(formData.floor_number) : null,
        work_percentage: parseFloat(formData.work_percentage)
      };

      if (editingWorkday) {
        await axios.put(`${API}/workdays/${editingWorkday.id}`, submitData);
      } else {
        await axios.post(`${API}/workdays`, submitData);
      }
      
      setShowForm(false);
      setEditingWorkday(null);
      resetForm();
      fetchWorkdays();
    } catch (error) {
      console.error('Error saving workday:', error);
    }
  };

  const handleEdit = (workday) => {
    setEditingWorkday(workday);
    setFormData({
      project_id: workday.project_id,
      work_section: workday.work_section,
      work_area: workday.work_area,
      floor_number: workday.floor_number,
      work_percentage: workday.work_percentage,
      workers: workday.workers,
      vehicle_used: workday.vehicle_used || '',
      notes: workday.notes || '',
      work_date: workday.work_date
    });
    
    const project = projects.find(p => p.id === workday.project_id);
    setSelectedProject(project);
    setShowForm(true);
  };

  const handleDelete = async (workdayId) => {
    if (window.confirm('هل أنت متأكد من حذف يوم العمل هذا؟')) {
      try {
        await axios.delete(`${API}/workdays/${workdayId}`);
        fetchWorkdays();
      } catch (error) {
        console.error('Error deleting workday:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      work_section: '',
      work_area: '',
      floor_number: null,
      work_percentage: 0,
      workers: [],
      vehicle_used: '',
      notes: '',
      work_date: new Date().toISOString().split('T')[0]
    });
    setSelectedProject(null);
  };

  const handleWorkerChange = (workerId, isChecked) => {
    if (isChecked) {
      setFormData({...formData, workers: [...formData.workers, workerId]});
    } else {
      setFormData({...formData, workers: formData.workers.filter(id => id !== workerId)});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة أيام العمل</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          إضافة يوم عمل جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingWorkday ? 'تعديل يوم العمل' : 'إضافة يوم عمل جديد'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">المشروع</label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="">اختر المشروع</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">تاريخ العمل</label>
                <input
                  type="date"
                  required
                  value={formData.work_date}
                  onChange={(e) => setFormData({...formData, work_date: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
              
              {selectedProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">قسم العمل</label>
                  <select
                    required
                    value={formData.work_section}
                    onChange={(e) => setFormData({...formData, work_section: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  >
                    <option value="">اختر قسم العمل</option>
                    {getAllWorkItems().map((item, index) => (
                      <option key={index} value={item.name}>
                        {item.name} ({item.type === 'section' ? 'قسم' : 'إضافة'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">اسم المنطقة المعمول بها</label>
                <input
                  type="text"
                  required
                  value={formData.work_area}
                  onChange={(e) => setFormData({...formData, work_area: e.target.value})}
                  placeholder="مثال: الغرفة الرئيسية، الحمام الأول، الشرفة الأمامية"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
              
              {selectedProject?.type === 'building' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">رقم الطبقة</label>
                  <select
                    required
                    value={formData.floor_number || ''}
                    onChange={(e) => setFormData({...formData, floor_number: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  >
                    <option value="">اختر الطبقة</option>
                    {Array.from({length: selectedProject.floors_count}, (_, i) => i + 1).map(floor => (
                      <option key={floor} value={floor}>الطبقة {floor}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">نسبة العمل المنجزة في هذا القسم (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={formData.work_percentage}
                  onChange={(e) => setFormData({...formData, work_percentage: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">السيارة المستخدمة (اختياري)</label>
                <input
                  type="text"
                  value={formData.vehicle_used}
                  onChange={(e) => setFormData({...formData, vehicle_used: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">الملاحظات (اختياري)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  rows="3"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العمال الذين عملوا</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {workers.map(worker => (
                  <div key={worker.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={worker.id}
                      checked={formData.workers.includes(worker.id)}
                      onChange={(e) => handleWorkerChange(worker.id, e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor={worker.id} className="ml-2 block text-sm text-gray-900">
                      {worker.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingWorkday(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                {editingWorkday ? 'تحديث يوم العمل' : 'حفظ يوم العمل'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">قائمة أيام العمل</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {workdays.map(workday => (
            <div key={workday.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {projects.find(p => p.id === workday.project_id)?.name || 'مشروع محذوف'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {workday.work_section} - {workday.work_area}
                    {workday.floor_number && ` (الطبقة ${workday.floor_number})`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {workday.work_date}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium text-green-600">
                      {workday.work_percentage}% مكتمل
                    </p>
                    <p className="text-sm text-gray-500">
                      العمال: {workday.workers.length}
                    </p>
                    {workday.vehicle_used && (
                      <p className="text-sm text-gray-500">السيارة: {workday.vehicle_used}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(workday)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(workday.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    حذف
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">العمال:</h5>
                  <div className="flex flex-wrap gap-2">
                    {workday.workers.map(workerId => {
                      const worker = workers.find(w => w.id === workerId);
                      return worker ? (
                        <span key={workerId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {worker.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                
                {workday.notes && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">الملاحظات:</h5>
                    <p className="text-sm text-gray-600">{workday.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        {isRegistering ? (
          <div>
            <Register />
            <div className="text-center mt-4">
              <button
                onClick={() => setIsRegistering(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                لديك حساب؟ تسجيل الدخول
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Login />
            <div className="text-center mt-4">
              <button
                onClick={() => setIsRegistering(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                ليس لديك حساب؟ تسجيل جديد
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <Dashboard />;
};

// Wrap App with AuthProvider
const AppWithProvider = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithProvider;