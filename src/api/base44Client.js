// هذا ملف وهمي عشان تمشي عملية البناء
export const base44 = {
  auth: {
    signInWithPassword: async () => {
      console.log("Demo Mode: Login");
      return { data: {}, error: null };
    },
    signUp: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => ({ data: {}, error: null }),
        order: () => ({ data: [], error: null }),
      }),
      order: () => ({ data: [], error: null }),
    }),
    insert: () => ({ data: {}, error: null }),
    update: () => ({ data: {}, error: null }),
    delete: () => ({ data: {}, error: null }),
  }),
};
