import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { maintenanceApi } from '../api/client';
import './Maintenance.css';

export default function Maintenance() {
    const { t } = useTranslation();
    const [tasks, setTasks] = useState([]);
    const [view, setView] = useState('calendar');

    useEffect(() => {
        maintenanceApi.getAll().then(r => setTasks(r.data)).catch(() => { });
    }, []);

    const overdue = tasks.filter(t => t.status === 'overdue');
    const pending = tasks.filter(t => t.status === 'pending');
    const activePrinters = 12;

    const typeColor = (type) => {
        const colors = { lubrication: '#3b82f6', calibration: '#f59e0b', cleaning: '#6b7280', firmware: '#f97316', mechanical: '#ef4444', general: '#9ca3af' };
        return colors[type] || '#9ca3af';
    };

    // Simple month calendar
    const month = 'October 2023';
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const startDay = 0; // Oct 1 is Sunday
    const weeks = [];
    let week = new Array(startDay).fill(null);
    for (const d of days) {
        week.push(d);
        if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

    const getTasksForDay = (day) => tasks.filter(t => {
        const d = new Date(t.scheduled_date);
        return d.getDate() === day;
    });

    return (
        <div className="maintenance-page">
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>{t('maintenanceTitle')}</h1>
                        <p>{t('maintenanceSubtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn maint-btn-secondary">
                            <span className="material-icons-outlined" style={{ fontSize: 16 }}>history</span>
                            {t('viewLogs')}
                        </button>
                        <button className="btn maint-btn-primary">
                            <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
                            {t('scheduleTask')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="maint-tabs">
                <button className={`maint-tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
                    <span className="material-icons-outlined" style={{ fontSize: 16 }}>calendar_month</span>
                    {t('calendarView')}
                </button>
                <button className={`maint-tab ${view === 'timeline' ? 'active' : ''}`} onClick={() => setView('timeline')}>
                    <span className="material-icons-outlined" style={{ fontSize: 16 }}>view_timeline</span>
                    {t('timelineView')}
                </button>
            </div>

            <div className="maint-layout">
                <div className="maint-calendar">
                    <div className="cal-header">
                        <button className="btn-icon maint-icon"><span className="material-icons-outlined">chevron_left</span></button>
                        <span className="cal-month">{month}</span>
                        <button className="btn-icon maint-icon"><span className="material-icons-outlined">chevron_right</span></button>
                        <button className="btn maint-btn-secondary" style={{ marginLeft: 'auto', fontSize: 'var(--font-size-xs)' }}>Today</button>
                    </div>
                    <div className="cal-grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="cal-day-name">{d}</div>
                        ))}
                        {weeks.flat().map((day, i) => (
                            <div key={i} className={`cal-cell ${day ? '' : 'empty'}`}>
                                {day && (
                                    <>
                                        <span className="cal-day-num">{day}</span>
                                        {getTasksForDay(day).map((task, j) => (
                                            <div key={j} className="cal-event" style={{ backgroundColor: typeColor(task.task_type) }}>
                                                {task.title.substring(0, 15)}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="maint-sidebar">
                    {overdue.length > 0 && (
                        <div className="maint-overdue-panel">
                            <div className="maint-overdue-header">
                                <span className="material-icons-outlined">warning</span>
                                {t('overdueMaintenance')}
                            </div>
                            {overdue.map(task => (
                                <div key={task.id} className="maint-overdue-item">
                                    <div className="overdue-badge">{task.overdue_days} {task.overdue_days > 1 ? t('daysOverdue') : t('dayOverdue')}</div>
                                    <div className="overdue-title">{task.title}</div>
                                    <div className="overdue-printer text-muted">Printer: {task.printer_name || '—'}</div>
                                    <button className="btn maint-btn-danger">{t('resolveNow')}</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="maint-upcoming">
                        <h3>{t('nextScheduledTasks')}</h3>
                        {pending.slice(0, 4).map((task, i) => (
                            <div key={task.id} className="upcoming-item">
                                <div className="upcoming-dot" style={{ backgroundColor: typeColor(task.task_type) }}></div>
                                <div>
                                    <div className="upcoming-time">
                                        {i === 0 ? t('today') : i === 1 ? t('tomorrow') : task.scheduled_date} • {task.scheduled_time}
                                    </div>
                                    <div className="upcoming-title">{task.title}</div>
                                    <div className="upcoming-printer text-muted">{task.printer_name || 'All Active Units'}</div>
                                </div>
                            </div>
                        ))}
                        <button className="maint-link">{t('viewFullTimeline')} →</button>
                    </div>
                </div>
            </div>

            <div className="maint-footer">
                <div className="maint-footer-item">
                    <span className="status-dot active"></span>
                    {activePrinters} {t('printersOnline')}
                </div>
                <div className="maint-footer-item">
                    <span className="status-dot low"></span>
                    {pending.length} {t('pendingMaintenance')}
                </div>
                <div className="maint-footer-item">
                    <span className="status-dot critical"></span>
                    {overdue.length} {t('overdueAlerts')}
                </div>
            </div>
        </div>
    );
}
