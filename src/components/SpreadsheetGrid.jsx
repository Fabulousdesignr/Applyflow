import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Maximize2, 
  Trash2, 
  ChevronDown, 
  Plus, 
  Check,
  Filter,
  Save
} from 'lucide-react';
import { calculateCompatibilityScore } from '../database/db';

const COLUMNS = [
  { id: 'company_name', label: 'Company Name', type: 'text', className: 'col-company' },
  { id: 'role_title', label: 'Role Title', type: 'text', className: 'col-role' },
  { id: 'country', label: 'Country', type: 'text', className: 'col-country' },
  { id: 'company_type', label: 'Type', type: 'select', className: 'col-type', options: ['AI Startup', 'SaaS', 'Fintech', 'Agency', 'No-Code Studio', 'Reddit'] },
  { id: 'company_size', label: 'Size', type: 'text', className: 'col-size' },
  { id: 'compatibility_score', label: 'Score', type: 'score', className: 'col-score' },
  { id: 'salary_estimate', label: 'Salary', type: 'text', className: 'col-salary' },
  { id: 'wat_compatibility', label: 'WAT Fit', type: 'select', className: 'col-wat', options: ['Perfect', 'High', 'Medium', 'Low'] },
  { id: 'hiring_freshness', label: 'Freshness', type: 'text', className: 'col-freshness' },
  { id: 'status', label: 'Status', type: 'select', className: 'col-status', options: ['Not Started', 'Researching', 'Applying', 'Applied', 'Followed Up', 'Interview', 'Rejected', 'Offer', 'Closed'] },
  { id: 'priority', label: 'Priority', type: 'select', className: 'col-priority', options: ['High', 'Medium', 'Low'] },
];

export default function SpreadsheetGrid({ 
  opportunities, 
  onSaveRow, 
  onDeleteRow, 
  onOpenDrawer, 
  selectedOpp,
  setSelectedOpp 
}) {
  // Grid interactive states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeFilterPreset, setActiveFilterPreset] = useState('All');
  
  // Sort states
  const [sortField, setSortField] = useState('compatibility_score');
  const [sortAsc, setSortAsc] = useState(false); // Default descending for highest score first!
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Inline cell focus and edit states
  const [focusCell, setFocusCell] = useState(null); // { rowIndex, colIndex }
  const [editCell, setEditCell] = useState(null); // { rowIndex, colIndex }
  const [editValue, setEditValue] = useState('');

  // Refs for tracking keys and focus
  const gridTableRef = useRef(null);
  const editInputRef = useRef(null);

  // Auto-focus inline edit input
  useEffect(() => {
    if (editCell && editInputRef.current) {
      editInputRef.current.focus();
      if (editInputRef.current.select) {
        editInputRef.current.select();
      }
    }
  }, [editCell]);

  // Sync selected IDs when opportunities list changes
  useEffect(() => {
    setSelectedIds([]);
  }, [opportunities]);

  // Process rows through filters and sorting
  let filteredRows = opportunities.filter(item => {
    // 1. Full text search
    const query = search.toLowerCase();
    const matchesSearch = 
      item.company_name.toLowerCase().includes(query) ||
      item.role_title.toLowerCase().includes(query) ||
      (item.country && item.country.toLowerCase().includes(query)) ||
      (item.key_tools_mentioned && item.key_tools_mentioned.toLowerCase().includes(query)) ||
      (item.ai_workflow_mentioned && item.ai_workflow_mentioned.toLowerCase().includes(query));

    // 2. Select dropdown filters
    const matchesType = typeFilter === 'All' || item.company_type === typeFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;

    // 3. Saved Filter Presets
    let matchesPreset = true;
    if (activeFilterPreset === 'wat_perfect') {
      matchesPreset = String(item.wat_compatibility).toLowerCase().includes('perfect');
    } else if (activeFilterPreset === 'high_score') {
      matchesPreset = item.compatibility_score >= 80;
    } else if (activeFilterPreset === 'active_interview') {
      matchesPreset = item.status === 'Interview';
    } else if (activeFilterPreset === 'ai_native') {
      const ai = String(item.ai_workflow_mentioned || '').toLowerCase();
      matchesPreset = ai.includes('cursor') || ai.includes('v0') || ai.includes('claude') || ai.includes('lovable');
    }

    return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesPreset;
  });

  // Sort rows
  if (sortField) {
    filteredRows.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'compatibility_score') {
        return sortAsc ? valA - valB : valB - valA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!focusCell) return;
      
      // If we are currently editing a cell, only intercept Escape or Enter
      if (editCell) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setEditCell(null);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          saveFocusedCellEdit();
        }
        return;
      }

      const rowsCount = filteredRows.length;
      if (rowsCount === 0) return;

      const colsCount = COLUMNS.length; // From 0 (Company) to 10 (Priority)
      
      let nextRow = focusCell.rowIndex;
      let nextCol = focusCell.colIndex;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          nextRow = Math.max(0, focusCell.rowIndex - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          nextRow = Math.min(rowsCount - 1, focusCell.rowIndex + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nextCol = Math.max(0, focusCell.colIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextCol = Math.min(colsCount - 1, focusCell.colIndex + 1);
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            nextCol = focusCell.colIndex - 1;
            if (nextCol < 0) {
              nextCol = colsCount - 1;
              nextRow = Math.max(0, focusCell.rowIndex - 1);
            }
          } else {
            nextCol = focusCell.colIndex + 1;
            if (nextCol >= colsCount) {
              nextCol = 0;
              nextRow = Math.min(rowsCount - 1, focusCell.rowIndex + 1);
            }
          }
          break;
        case 'Enter':
          e.preventDefault();
          // Put cell in edit mode
          const cellField = COLUMNS[focusCell.colIndex].id;
          const targetOpp = filteredRows[focusCell.rowIndex];
          if (cellField !== 'compatibility_score') {
            setEditCell({ rowIndex: focusCell.rowIndex, colIndex: focusCell.colIndex });
            setEditValue(targetOpp[cellField] || '');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setFocusCell(null);
          break;
        case 'Backspace':
        case 'Delete':
          // Clear text of active focused cell
          const activeField = COLUMNS[focusCell.colIndex].id;
          const activeOpp = filteredRows[focusCell.rowIndex];
          if (activeField !== 'compatibility_score') {
            const updated = { ...activeOpp, [activeField]: '' };
            if (activeField === 'wat_compatibility' || activeField === 'company_size' || activeField === 'global_remote_friendly' || activeField === 'ai_workflow_mentioned') {
              updated.compatibility_score = calculateCompatibilityScore(updated);
            }
            onSaveRow(updated);
          }
          break;
        default:
          return;
      }

      setFocusCell({ rowIndex: nextRow, colIndex: nextCol });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusCell, editCell, editValue, filteredRows]);

  // Save inline cell changes
  const saveFocusedCellEdit = () => {
    if (!editCell) return;
    const opp = filteredRows[editCell.rowIndex];
    const fieldName = COLUMNS[editCell.colIndex].id;
    const updated = { ...opp, [fieldName]: editValue };
    
    // Automatically re-compute score if field influences score calculation
    if (
      fieldName === 'wat_compatibility' ||
      fieldName === 'company_size' ||
      fieldName === 'global_remote_friendly' ||
      fieldName === 'ai_workflow_mentioned' ||
      fieldName === 'mid_entry_friendly' ||
      fieldName === 'outreach_method'
    ) {
      updated.compatibility_score = calculateCompatibilityScore(updated);
    }

    onSaveRow(updated);
    setEditCell(null);
  };

  // Click handler for cell focus
  const handleCellClick = (rowIndex, colIndex, e) => {
    e.stopPropagation();
    setFocusCell({ rowIndex, colIndex });
    // Only close editing if clicking a different cell
    if (editCell && (editCell.rowIndex !== rowIndex || editCell.colIndex !== colIndex)) {
      setEditCell(null);
    }
  };

  // Double click handler for instant editing
  const handleCellDoubleClick = (rowIndex, colIndex, fieldName, value, e) => {
    e.stopPropagation();
    if (fieldName === 'compatibility_score') return; // Cannot edit score directly
    setFocusCell({ rowIndex, colIndex });
    setEditCell({ rowIndex, colIndex });
    setEditValue(value || '');
  };

  // Add a blank row instantly (Notion spreadsheet style!)
  const handleAddBlankRow = () => {
    const blankRow = {
      company_name: "New Company",
      role_title: "Product Designer",
      country: "Global Remote",
      company_type: "SaaS",
      company_size: "11-50",
      remote_status: "Fully Remote",
      global_remote_friendly: "Yes",
      mid_entry_friendly: "Yes",
      ai_workflow_mentioned: "",
      key_tools_mentioned: "Figma",
      salary_estimate: "",
      date_posted: "May 2026",
      hiring_freshness: "Active",
      wat_compatibility: "Perfect",
      career_page: "",
      application_link: "",
      linkedin_page: "",
      founder_hr_name: "",
      outreach_method: "Direct Apply",
      why_i_have_a_chance: "",
      portfolio_advice: "",
      application_emphasis: "",
      status: "Not Started",
      priority: "Medium",
      notes: "",
      follow_up_date: "",
      applied_date: "",
      interview_stage: ""
    };
    onSaveRow(blankRow);
    
    // Auto-focus company cell of new row
    setTimeout(() => {
      setFocusCell({ rowIndex: 0, colIndex: 0 });
      setEditCell({ rowIndex: 0, colIndex: 0 });
      setEditValue("New Company");
    }, 150);
  };

  // Checkbox toggle actions
  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredRows.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id, e) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Mass Updates
  const handleBulkStatusChange = async (newStatus) => {
    for (const id of selectedIds) {
      const opp = opportunities.find(o => o.id === id);
      if (opp) {
        opp.status = newStatus;
        if (newStatus === 'Applied' && !opp.applied_date) {
          opp.applied_date = new Date().toISOString().substring(0, 10);
        }
        await onSaveRow(opp);
      }
    }
    setSelectedIds([]);
  };

  const handleBulkPriorityChange = async (newPriority) => {
    for (const id of selectedIds) {
      const opp = opportunities.find(o => o.id === id);
      if (opp) {
        opp.priority = newPriority;
        await onSaveRow(opp);
      }
    }
    setSelectedIds([]);
  };

  const handleBulkDeleteRows = async () => {
    if (window.confirm(`Delete the ${selectedIds.length} selected opportunities permanently?`)) {
      for (const id of selectedIds) {
        await onDeleteRow(id);
      }
      setSelectedIds([]);
    }
  };

  // Column header click to change sorting
  const handleHeaderClick = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Descending by default for highest values
    }
  };

  // Preset Filters lists
  const filterPresets = [
    { id: 'All', label: 'All Operations' },
    { id: 'wat_perfect', label: 'Perfect WAT Overlap' },
    { id: 'high_score', label: 'Highly Compatible (>80)' },
    { id: 'active_interview', label: 'Active Interviews' },
    { id: 'ai_native', label: 'AI-Native Workflow' }
  ];

  return (
    <div className="grid-container" onClick={() => { setFocusCell(null); setEditCell(null); }}>
      
      {/* Filters & Control bar */}
      <div className="grid-filters-row" onClick={(e) => e.stopPropagation()}>
        <div className="filters-left">
          
          {/* Preset Pill Selectors */}
          <div style={{ display: 'flex', gap: '4px', marginRight: '12px' }}>
            {filterPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => setActiveFilterPreset(preset.id)}
                className={`btn btn-secondary ${activeFilterPreset === preset.id ? 'filter-btn-active' : ''}`}
                style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="search-input-wrapper">
            <Search size={12} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search company, tools, AI stacks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Quick Dropdown Selectors */}
          <select 
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Sectors</option>
            <option value="AI Startup">AI Startups</option>
            <option value="SaaS">SaaS</option>
            <option value="Fintech">Fintech</option>
            <option value="Agency">Agencies</option>
            <option value="No-Code Studio">Webflow/No-Code</option>
            <option value="Reddit">Reddit Outreach</option>
          </select>

          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="Researching">Researching</option>
            <option value="Applying">Applying</option>
            <option value="Applied">Applied</option>
            <option value="Followed Up">Followed Up</option>
            <option value="Interview">Interviews</option>
            <option value="Rejected">Rejected</option>
            <option value="Offer">Offers</option>
          </select>
        </div>

        <button 
          onClick={handleAddBlankRow}
          className="btn btn-primary"
          style={{ height: '26px' }}
        >
          <Plus size={14} />
          <span>New Opportunity</span>
        </button>
      </div>

      {/* Grid Canvas */}
      <div className="grid-wrapper">
        <table className="spreadsheet-table" ref={gridTableRef}>
          <thead>
            <tr>
              <th className="cell-checkbox" style={{ position: 'sticky', left: 0, zIndex: 6 }}>
                <input 
                  type="checkbox" 
                  checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                  onChange={handleToggleSelectAll}
                />
              </th>
              {COLUMNS.map((col) => (
                <th 
                  key={col.id} 
                  className={col.className}
                  onClick={() => handleHeaderClick(col.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span>{col.label}</span>
                    <ArrowUpDown size={10} style={{ color: sortField === col.id ? 'var(--text-primary)' : 'var(--text-muted)' }} />
                  </div>
                </th>
              ))}
              <th className="col-actions">Open</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 2} style={{ height: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No jobs found matching your filters. Click "New Opportunity" or upload a brief to parse.
                </td>
              </tr>
            ) : (
              filteredRows.map((opp, rowIndex) => {
                const isSelected = selectedIds.includes(opp.id);
                return (
                  <tr 
                    key={opp.id} 
                    className={`grid-row ${isSelected ? 'selected' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="cell-checkbox" style={{ position: 'sticky', left: 0, zIndex: 4, backgroundColor: isSelected ? '#162235' : 'var(--bg-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => handleToggleRow(opp.id, e)}
                      />
                    </td>

                    {/* Dynamic Data Columns */}
                    {COLUMNS.map((col, colIndex) => {
                      const isFocused = focusCell && focusCell.rowIndex === rowIndex && focusCell.colIndex === colIndex;
                      const isEditing = editCell && editCell.rowIndex === rowIndex && editCell.colIndex === colIndex;
                      const val = opp[col.id];

                      return (
                        <td 
                          key={col.id}
                          className={`grid-cell editable ${col.className} ${isFocused ? 'active-focus' : ''}`}
                          onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                          onDoubleClick={(e) => handleCellDoubleClick(rowIndex, colIndex, col.id, val, e)}
                        >
                          {isEditing ? (
                            col.type === 'select' ? (
                              <select
                                ref={editInputRef}
                                value={editValue}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setEditValue(newVal);
                                  
                                  // Save instantly upon select!
                                  const updated = { ...opp, [col.id]: newVal };
                                  if (
                                    col.id === 'wat_compatibility' ||
                                    col.id === 'company_size' ||
                                    col.id === 'global_remote_friendly' ||
                                    col.id === 'ai_workflow_mentioned' ||
                                    col.id === 'mid_entry_friendly' ||
                                    col.id === 'outreach_method'
                                  ) {
                                    updated.compatibility_score = calculateCompatibilityScore(updated);
                                  }
                                  onSaveRow(updated);
                                  setEditCell(null);
                                }}
                                onKeyDown={(e) => { if (e.key === 'Escape') setEditCell(null); }}
                                className="cell-edit-select"
                              >
                                {col.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input 
                                ref={editInputRef}
                                type="text"
                                value={editValue}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveFocusedCellEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveFocusedCellEdit();
                                  if (e.key === 'Escape') setEditCell(null);
                                }}
                                className="cell-edit-input"
                              />
                            )
                          ) : (
                            <div className="cell-inner-text">
                              {col.id === 'status' ? (
                                <span className={`badge badge-${String(val).toLowerCase().replace(/\s+/g, '')}`}>
                                  {val}
                                </span>
                              ) : col.id === 'priority' ? (
                                <span className={`priority-${String(val).toLowerCase()}`}>
                                  {val}
                                </span>
                              ) : col.id === 'compatibility_score' ? (
                                <span className={`score-pill ${val >= 80 ? 'high' : val >= 50 ? 'medium' : 'low'}`}>
                                  {val} pts
                                </span>
                              ) : (
                                String(val || '')
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Slide Drawer Trigger */}
                    <td className="col-actions" style={{ textAlign: 'center' }}>
                      <div 
                        className="icon-btn" 
                        style={{ display: 'inline-flex', alignSelf: 'center' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDrawer(opp);
                        }}
                        title="View details & outreach strategy"
                      >
                        <Maximize2 size={13} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk actions tray */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-footer" onClick={(e) => e.stopPropagation()}>
          <span className="bulk-count-label">{selectedIds.length} rows selected</span>
          <div className="sidebar-divider" style={{ height: '16px', width: '1px', margin: '0' }} />
          
          <div className="bulk-buttons-group">
            {/* Status change select */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkStatusChange(e.target.value);
              }}
              className="filter-select"
              style={{ height: '26px', fontSize: '11px', padding: '0 24px 0 8px' }}
            >
              <option value="" disabled>Set Status...</option>
              <option value="Not Started">Not Started</option>
              <option value="Researching">Researching</option>
              <option value="Applying">Applying</option>
              <option value="Applied">Applied</option>
              <option value="Followed Up">Followed Up</option>
              <option value="Interview">Interview</option>
              <option value="Rejected">Rejected</option>
              <option value="Offer">Offer</option>
            </select>

            {/* Priority change select */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkPriorityChange(e.target.value);
              }}
              className="filter-select"
              style={{ height: '26px', fontSize: '11px', padding: '0 24px 0 8px' }}
            >
              <option value="" disabled>Set Priority...</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button 
              onClick={handleBulkDeleteRows}
              className="btn btn-danger"
              style={{ height: '26px' }}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
