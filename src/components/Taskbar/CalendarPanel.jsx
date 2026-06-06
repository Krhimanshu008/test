import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ControlCenter.css'; // Reuse glassy styles

const CalendarPanel = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === new Date().getDate() && 
                    currentDate.getMonth() === new Date().getMonth() && 
                    currentDate.getFullYear() === new Date().getFullYear();
    days.push(
      <div key={`day-${i}`} className={`cal-day ${isToday ? 'today' : ''}`}>
        {i}
      </div>
    );
  }

  return (
    <div className="calendar-panel glass-panel-dark" onClick={(e) => e.stopPropagation()}>
      <div className="cal-header">
        <button onClick={prevMonth} className="cal-nav"><ChevronLeft size={16} /></button>
        <div className="cal-title">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
        <button onClick={nextMonth} className="cal-nav"><ChevronRight size={16} /></button>
      </div>
      <div className="cal-grid">
        <div className="cal-week-header">Su</div>
        <div className="cal-week-header">Mo</div>
        <div className="cal-week-header">Tu</div>
        <div className="cal-week-header">We</div>
        <div className="cal-week-header">Th</div>
        <div className="cal-week-header">Fr</div>
        <div className="cal-week-header">Sa</div>
        {days}
      </div>
    </div>
  );
};

export default CalendarPanel;
