import { ChangeLogEntry, ChangeLogAction, ChangeLogEntity, User } from '@/types';

// Utility function to log changes
export const logChange = async (
  user: User,
  action: ChangeLogAction,
  entity: ChangeLogEntity,
  options: {
    entityId?: string;
    entityName?: string;
    changes?: {
      before?: Record<string, any>;
      after?: Record<string, any>;
      fields?: string[];
    };
    details?: string;
  } = {}
): Promise<void> => {
  try {
    const logEntry = {
      userId: user.id,
      username: user.username,
      userRole: user.role,
      action,
      entity,
      entityId: options.entityId,
      entityName: options.entityName,
      changes: options.changes,
      details: options.details
    };

    // Try to send to server first
    try {
      const response = await fetch('/api/changelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });

      if (response.ok) {
        console.log('✅ Change logged to server:', action, entity);
        return;
      } else {
        console.warn('⚠️ Server logging failed, using local storage');
      }
    } catch (serverError) {
      console.warn('⚠️ Server logging failed, using local storage:', serverError);
    }

    // Fallback to localStorage
    const logs = JSON.parse(localStorage.getItem('mirage_changelog') || '[]');
    const newEntry: ChangeLogEntry = {
      ...logEntry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    logs.push(newEntry);

    // Keep only the last 5000 entries in localStorage
    if (logs.length > 5000) {
      logs.splice(0, logs.length - 5000);
    }

    localStorage.setItem('mirage_changelog', JSON.stringify(logs));
    console.log('✅ Change logged to localStorage:', action, entity);

  } catch (error) {
    console.error('❌ Failed to log change:', error);
  }
};

// Helper function to log tender changes
export const logTenderChange = async (
  user: User,
  action: ChangeLogAction,
  tender: any,
  previousTender?: any
) => {
  const changes = previousTender ? {
    before: previousTender,
    after: tender,
    fields: Object.keys(tender).filter(key => 
      JSON.stringify(tender[key]) !== JSON.stringify(previousTender[key])
    )
  } : undefined;

  await logChange(user, action, 'TENDER', {
    entityId: tender.id,
    entityName: `${tender.customerName} - ${tender.leadType}`,
    changes,
    details: action === 'CREATE' 
      ? `Created new tender for ${tender.customerName}`
      : action === 'UPDATE'
      ? `Updated tender: ${changes?.fields?.join(', ') || 'multiple fields'}`
      : action === 'DELETE'
      ? `Deleted tender for ${tender.customerName}`
      : `${action} tender`
  });
};

// Helper function to log user changes
export const logUserChange = async (
  currentUser: User,
  action: ChangeLogAction,
  targetUser: any,
  previousUser?: any
) => {
  const changes = previousUser ? {
    before: { ...previousUser, password: '[REDACTED]' },
    after: { ...targetUser, password: '[REDACTED]' },
    fields: Object.keys(targetUser).filter(key => 
      key !== 'password' && JSON.stringify(targetUser[key]) !== JSON.stringify(previousUser[key])
    )
  } : undefined;

  await logChange(currentUser, action, 'USER', {
    entityId: targetUser.id,
    entityName: `${targetUser.name} (${targetUser.username})`,
    changes,
    details: action === 'CREATE' 
      ? `Created new user: ${targetUser.name}`
      : action === 'UPDATE'
      ? `Updated user: ${changes?.fields?.join(', ') || 'multiple fields'}`
      : action === 'DELETE'
      ? `Deleted user: ${targetUser.name}`
      : `${action} user`
  });
};

// Helper function to log system events
export const logSystemEvent = async (
  user: User,
  action: ChangeLogAction,
  details: string
) => {
  await logChange(user, action, 'SYSTEM', {
    details
  });
};

// Helper function to log file operations
export const logFileOperation = async (
  user: User,
  action: ChangeLogAction,
  fileName: string,
  fileType?: string,
  tenderId?: string
) => {
  await logChange(user, action, 'FILE', {
    entityId: tenderId,
    entityName: fileName,
    details: `${action} file: ${fileName}${fileType ? ` (${fileType})` : ''}${tenderId ? ` for tender ${tenderId}` : ''}`
  });
};

// Helper function to log report generation
export const logReportGeneration = async (
  user: User,
  reportType: string,
  filters?: any
) => {
  await logChange(user, 'EXPORT', 'REPORT', {
    entityName: reportType,
    details: `Generated ${reportType} report${filters ? ` with filters: ${JSON.stringify(filters)}` : ''}`
  });
};