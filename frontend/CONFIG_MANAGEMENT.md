# Configuration Management Best Practices

## ✅ NEW PATTERN: Database-Driven Configuration (DO THIS)

All dynamic values should be fetched from the database via the centralized `AppConfigContext`.

### Step 1: Use the Hook in Any Component

```typescript
import { useAppConfig, getConfigAsString, getConfigAsNumber } from '../contexts/AppConfigContext';

const MyComponent: React.FC = () => {
  const { appConfig } = useAppConfig();
  
  // Access configuration values
  const storeName = getConfigAsString(appConfig, 'store_name', 'MyStore');
  const taxRate = getConfigAsNumber(appConfig, 'tax_rate', 10);
  const storeTagline = getConfigAsString(appConfig, 'store_tagline', 'Welcome');
  
  return <div>{storeName}</div>;
};
```

### Step 2: Add Settings to Database

In your backend, add settings to the `settings` table:

```sql
-- Store Configuration
INSERT INTO settings (key, value) VALUES
('store_name', 'NexusMart'),
('store_tagline', 'Where Excellence Meets Convenience'),
('tax_rate', '15'),  -- Stored as percentage string
('reorder_level', '10'),  -- Default reorder level
('currency_symbol', '₹');
```

### Step 3: Helper Functions

The `AppConfigContext` provides helper functions:

```typescript
const { appConfig } = useAppConfig();

// Get as string with default
getConfigAsString(appConfig, 'key', 'default');

// Get as number with default
getConfigAsNumber(appConfig, 'key', 0);

// Get raw value
getConfigValue(appConfig, 'key', null);
```

## ❌ OLD PATTERN: Hardcoded Values (DON'T DO THIS)

```typescript
// ❌ BAD - Hardcoded values
const storeName = 'NexusMart';
const taxRate = 0.10;
const tagline = 'Where Excellence Meets Convenience';
```

## ❌ ANTI-PATTERN: Individual Component Fetches (DON'T DO THIS)

```typescript
// ❌ BAD - Each component fetches settings individually
useEffect(() => {
  api.get('/settings').then(res => {
    // ... process settings
  });
}, []);
```

**Why?** 
- Redundant API calls
- No caching
- Inconsistent data
- Poor performance

## ✅ CORRECT PATTERN: Centralized Fetch via AppConfigContext

```typescript
// ✅ GOOD - Fetches once at app startup, cached globally
const { appConfig } = useAppConfig();
const value = getConfigAsString(appConfig, 'key', 'default');
```

**Why?**
- Single API call at app startup
- Results cached in context
- Used throughout the app
- Efficient and consistent

## Migration Checklist

- [x] Create `AppConfigContext` in `/src/contexts/AppConfigContext.tsx`
- [x] Wrap app with `AppConfigProvider` in `App.tsx`
- [ ] Update Login page to use `store_name` from config
- [ ] Update Dashboard to use dynamic store name
- [ ] Update Sidebar to use dynamic branding
- [ ] Update POSPage invoice to use dynamic store name ✅
- [ ] Update Customers report to use dynamic store name
- [ ] Update SalesReports to use chart colors from settings
- [ ] Add all business configuration to the database

## Configuration Keys (Settings Table)

| Key | Type | Example | Purpose |
|-----|------|---------|---------|
| `store_name` | string | NexusMart | Application/store name |
| `store_tagline` | string | Where Excellence... | Store tagline/motto |
| `tax_rate` | string | 15 | Tax percentage (stored as string %) |
| `currency_symbol` | string | ₹ | Currency symbol |
| `reorder_level` | string | 10 | Default inventory reorder level |
| `chart_color_primary` | string | #3B82F6 | Primary chart color |
| `chart_color_success` | string | #10B981 | Success/positive color |
| `chart_color_warning` | string | #F59E0B | Warning color |
| `chart_color_danger` | string | #EF4444 | Danger/negative color |

## Example: Complete Migration

### Before (Hardcoded)
```typescript
// ❌ BAD
const storeName = 'NexusMart';

return (
  <h1>{storeName}</h1>
);
```

### After (Database-Driven)
```typescript
// ✅ GOOD
import { useAppConfig, getConfigAsString } from '../contexts/AppConfigContext';

const MyComponent = () => {
  const { appConfig } = useAppConfig();
  const storeName = getConfigAsString(appConfig, 'store_name', 'MyStore');
  
  return (
    <h1>{storeName}</h1>
  );
};
```

## Performance Notes

✅ **AppConfigContext Benefits:**
- Fetches data once at app startup via `/settings` endpoint
- Caches in React context (no re-fetches)
- Available to all components
- Provides sensible defaults if data is missing
- Zero redundant API calls

⚠️ **Refresh Configuration**
If you need to refresh settings after changes:
```typescript
const { refreshConfig } = useAppConfig();
await refreshConfig();
```

## Implementation Status

✅ **Done:**
- AppConfigContext created and integrated
- POSPage now uses dynamic tax_rate
- Tax calculation is dynamic

🚧 **Next:**
- Update remaining hardcoded store names
- Move business rules to database
- Add chart colors configuration
- Create admin UI for easy configuration management
