import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "https://iqac-back.onrender.com";

const SchoolWise = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        currentAY: '',
        semester: '',
        school: ''
    });
    const [options, setOptions] = useState({
        currentAYs: [],
        semesters: [],
        schools: []
    });
    const [departments, setDepartments] = useState([]);
    const [reportFormat, setReportFormat] = useState('excel');
    const [loading, setLoading] = useState(false);
    const [loadingSchools, setLoadingSchools] = useState(true);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingNegativeCommentsExcel, setLoadingNegativeCommentsExcel] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Fetch schools and current AY on component mount
    useEffect(() => {
        fetchSchools();
        fetchCurrentAY();
    }, []);

    // Fetch semesters when current AY changes
    useEffect(() => {
        if (filters.currentAY) {
            fetchSemesters(filters.currentAY);
            setFilters(prev => ({
                ...prev,
                semester: ''
            }));
        } else {
            setOptions(prev => ({ ...prev, semesters: [] }));
        }
    }, [filters.currentAY]);

    // Fetch departments when school changes
    useEffect(() => {
        if (filters.school) {
            fetchDepartments(filters.school);
        } else {
            setDepartments([]);
        }
    }, [filters.school]);

    const fetchCurrentAY = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/api/visualization/current-ay`);
            const data = await response.json();
            setOptions(prev => ({ ...prev, currentAYs: Array.isArray(data) ? data : [] }));
        } catch (error) {
            console.error('Error fetching current AY:', error);
            setOptions(prev => ({ ...prev, currentAYs: [] }));
        }
    };

    const fetchSemesters = async (currentAY) => {
        try {
            const params = new URLSearchParams();
            if (currentAY) {
                params.append('currentAY', encodeURIComponent(currentAY));
            }
            const response = await fetch(`${SERVER_URL}/api/visualization/semesters?${params.toString()}`);
            const data = await response.json();
            setOptions(prev => ({ ...prev, semesters: Array.isArray(data) ? data : [] }));
        } catch (error) {
            console.error('Error fetching semesters:', error);
            setOptions(prev => ({ ...prev, semesters: [] }));
        }
    };

    const fetchSchools = async () => {
        try {
            setLoadingSchools(true);
            const response = await fetch(`${SERVER_URL}/api/school-reports/schools`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch schools`);
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setOptions(prev => ({ ...prev, schools: data }));
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error fetching schools:', error);
            alert(`Error fetching schools: ${error.message}. Please check the server console for more details.`);
        } finally {
            setLoadingSchools(false);
        }
    };

    const fetchDepartments = async (school) => {
        try {
            setLoadingDepartments(true);
            const response = await fetch(`${SERVER_URL}/api/school-reports/schools/${encodeURIComponent(school)}/departments`);
            if (!response.ok) {
                throw new Error('Failed to fetch departments');
            }
            const data = await response.json();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            alert('Error fetching departments. Please try again.');
        } finally {
            setLoadingDepartments(false);
        }
    };


    const handleGenerateReport = async () => {
        if (!filters.currentAY || !filters.semester || !filters.school) {
            alert('Please select Current Academic Year, Semester, and School.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${SERVER_URL}/api/school-reports/generate-school-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    school: filters.school,
                    currentAY: filters.currentAY,
                    semester: filters.semester,
                    format: reportFormat
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to generate school report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileExtension = reportFormat === 'pdf' ? 'pdf' : 'xlsx';
            const safeSchoolName = filters.school.replace(/[^a-z0-9]/gi, '_');
            a.download = `${safeSchoolName}_school_report.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('School report error:', error);
            alert('Error generating school report: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateNegativeCommentsExcel = async () => {
        if (!filters.currentAY || !filters.semester || !filters.school) {
            alert('Please select Current Academic Year, Semester, and School.');
            return;
        }

        try {
            setLoadingNegativeCommentsExcel(true);
            const response = await fetch(`${SERVER_URL}/api/school-reports/generate-school-negative-comments-excel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    school: filters.school,
                    currentAY: filters.currentAY,
                    semester: filters.semester
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate negative comments Excel`);
            }

            const blob = await response.blob();
            if (!blob || blob.size === 0) {
                throw new Error('Received empty file from server');
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeSchoolName = filters.school.replace(/[^a-z0-9]/gi, '_');
            a.download = `${safeSchoolName}_negative_comments_report.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Negative comments Excel error:', error);
            alert('Error generating negative comments Excel: ' + error.message);
        } finally {
            setLoadingNegativeCommentsExcel(false);
        }
    };

    return (
        <div className="school-wise-container">
            <header className="header">
                <div className="logo-container">
                    <img 
                        src="https://www.kalasalingam.ac.in/wp-content/uploads/2022/02/Logo.png" 
                        alt="Kalasalingam Logo" 
                        className="logo" 
                    />
                    <div className="header-text">
                        <h1>Office of IQAC, KARE</h1>
                        <p>School-wise Feedback Analysis</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="home-btn" onClick={() => navigate('/')}>
                        <span>🏠</span> Home
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        <span>🚪</span> Logout
                    </button>
                </div>
            </header>

            <main className="main-content">
                <h1 className="page-title">School-wise Report Generation</h1>
                <p className="page-description">
                    Generate comprehensive feedback analysis reports for all departments within a school.
                    Reports include all degrees and batches to provide a complete overview of the school's performance.
                    Reports can be generated in Excel (multiple sheets) or PDF (multiple pages) format.
                </p>

                <div className="filters-section">
                    <div className="filter-group">
                        <label htmlFor="school-select">School *</label>
                        <select
                            id="school-select"
                            value={filters.school}
                            onChange={(e) => setFilters({
                                ...filters,
                                school: e.target.value,
                                currentAY: '',
                                semester: ''
                            })}
                            disabled={loadingSchools}
                            className="filter-select"
                        >
                            <option value="">Select School</option>
                            {options.schools.map((school, index) => (
                                <option key={index} value={school}>
                                    {school}
                                </option>
                            ))}
                        </select>
                        {loadingSchools && <span className="loading-text">Loading schools...</span>}
                    </div>

                    <div className="filter-group">
                        <label htmlFor="current-ay-select">Current Academic Year *</label>
                        <select
                            id="current-ay-select"
                            value={filters.currentAY}
                            onChange={(e) => setFilters({
                                ...filters,
                                currentAY: e.target.value,
                                semester: ''
                            })}
                            className="filter-select"
                        >
                            <option value="">Select Academic Year</option>
                            {options.currentAYs.map(ay => (
                                <option key={ay} value={ay}>{ay}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="semester-select">Semester *</label>
                        <select
                            id="semester-select"
                            value={filters.semester}
                            onChange={(e) => setFilters({
                                ...filters,
                                semester: e.target.value
                            })}
                            disabled={!filters.currentAY}
                            className="filter-select"
                        >
                            <option value="">Select Semester</option>
                            {options.semesters.map(sem => (
                                <option key={sem} value={sem}>{sem}</option>
                            ))}
                        </select>
                    </div>

                    {filters.school && (
                        <div className="filter-group">
                            <label>Departments in {filters.school}</label>
                            <div className="departments-list">
                                {loadingDepartments ? (
                                    <span className="loading-text">Loading departments...</span>
                                ) : departments.length > 0 ? (
                                    <div className="departments-badges">
                                        {departments.map((dept, index) => (
                                            <span key={index} className="department-badge">
                                                {dept}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="no-data-text">No departments found</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="filter-group">
                        <label htmlFor="format-select">Report Format</label>
                        <select
                            id="format-select"
                            value={reportFormat}
                            onChange={(e) => setReportFormat(e.target.value)}
                            className="filter-select"
                        >
                            <option value="excel">Excel (Multiple Sheets)</option>
                            <option value="pdf">PDF (Multiple Pages)</option>
                        </select>
                    </div>

                    <div className="action-buttons">
                        <button
                            className="generate-btn"
                            onClick={handleGenerateReport}
                            disabled={!filters.currentAY || !filters.semester || !filters.school || loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    <span>📊</span>
                                    Generate School Report
                                </>
                            )}
                        </button>
                        <button
                            className="generate-btn"
                            onClick={handleGenerateNegativeCommentsExcel}
                            disabled={!filters.currentAY || !filters.semester || !filters.school || loadingNegativeCommentsExcel}
                            style={{ marginLeft: '1rem', backgroundColor: '#28a745' }}
                        >
                            {loadingNegativeCommentsExcel ? (
                                <>
                                    <span className="spinner"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span>📝</span>
                                    Generate Negative Comments Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SchoolWise;

