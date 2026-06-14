import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock jsPDF
vi.mock('jspdf', () => {
  class MockedPDF {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    };
    setFillColor = vi.fn();
    rect = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    text = vi.fn();
    setDrawColor = vi.fn();
    setLineWidth = vi.fn();
    line = vi.fn();
    roundedRect = vi.fn();
    save = vi.fn();
  }
  return {
    jsPDF: MockedPDF,
    default: MockedPDF,
  };
});

// Mock Supabase Browser Client
const chainableMock = () => {
  const mockObj: any = {};
  const resolveValue = { data: [], error: null };
  
  mockObj.select = vi.fn().mockReturnValue(mockObj);
  mockObj.insert = vi.fn().mockResolvedValue(resolveValue);
  mockObj.update = vi.fn().mockReturnValue(mockObj);
  mockObj.upsert = vi.fn().mockResolvedValue(resolveValue);
  mockObj.delete = vi.fn().mockResolvedValue(resolveValue);
  mockObj.eq = vi.fn().mockReturnValue(mockObj);
  mockObj.order = vi.fn().mockReturnValue(mockObj);
  mockObj.single = vi.fn().mockReturnValue(mockObj);
  mockObj.maybeSingle = vi.fn().mockReturnValue(mockObj);
  mockObj.limit = vi.fn().mockReturnValue(mockObj);
  
  // Custom execution / resolution helper
  mockObj.then = (onfulfilled: any) => {
    return Promise.resolve(resolveValue).then(onfulfilled);
  };
  
  return mockObj;
};

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn().mockImplementation(() => chainableMock()),
  storage: {
    from: vi.fn().mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'http://signed-url.com' }, error: null }),
    }),
  },
};

// Mock the creator module
vi.mock('@/utils/supabase/client', () => {
  return {
    createClient: () => mockSupabase,
  };
});

// Export mock so tests can manipulate DB outputs
export { mockSupabase };
