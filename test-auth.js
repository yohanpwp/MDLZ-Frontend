/**
 * Simple test runner to validate authentication tests
 * This bypasses the Vite/Vitest crypto issue for validation
 */

// Mock the crypto API
global.crypto = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
};

// Mock localStorage
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
};

// Mock console methods
global.console = {
  ...console,
  error: () => {},
  log: () => {},
};

// Import and test AuthService directly
import AuthService from "./src/services/AuthService.js";
import { mockUsers } from "./src/__tests__/fixtures/authFixtures.js";

async function runAuthTests() {
  console.log("🧪 Running Authentication Integration Tests...\n");

  let passed = 0;
  let failed = 0;

  function test(name, testFn) {
    try {
      const result = testFn();
      if (result instanceof Promise) {
        return result
          .then(() => {
            console.log(`✅ ${name}`);
            passed++;
          })
          .catch((error) => {
            console.log(`❌ ${name}: ${error.message}`);
            failed++;
          });
      } else {
        console.log(`✅ ${name}`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  function expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toBeNull() {
        if (actual !== null) {
          throw new Error(`Expected null, got ${actual}`);
        }
      },
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Expected truthy value, got ${actual}`);
        }
      },
      toBeFalsy() {
        if (actual) {
          throw new Error(`Expected falsy value, got ${actual}`);
        }
      },
      toContain(expected) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`);
        }
      },
    };
  }

  // Test 1: Login with valid credentials
  await test("Login with valid admin credentials", async () => {
    const result = await AuthService.login({
      username: "admin",
      password: "admin123",
      rememberMe: false,
    });

    expect(result.user.username).toBe("admin");
    expect(result.user.role).toBe("admin");
    expect(result.token).toBeTruthy();
    expect(result.permissions.length).toBe(12); // Admin has all permissions
  });

  // Test 2: Login with invalid credentials
  await test("Login with invalid credentials should fail", async () => {
    try {
      await AuthService.login({
        username: "invalid",
        password: "wrong",
        rememberMe: false,
      });
      throw new Error("Should have thrown an error");
    } catch (error) {
      expect(error.message).toContain("Invalid username or password");
    }
  });

  // Test 3: Permission checking
  test("Admin should have all permissions", () => {
    const admin = mockUsers.admin;
    expect(AuthService.hasPermission(admin, "read_invoices")).toBe(true);
    expect(AuthService.hasPermission(admin, "manage_users")).toBe(true);
    expect(AuthService.hasPermission(admin, "configure_system")).toBe(true);
  });

  // Test 4: Role-based access
  test("Auditor should have limited permissions", () => {
    const auditor = mockUsers.auditor;
    expect(AuthService.hasPermission(auditor, "read_invoices")).toBe(true);
    expect(AuthService.hasPermission(auditor, "generate_reports")).toBe(true);
    expect(AuthService.hasPermission(auditor, "manage_users")).toBe(false);
    expect(AuthService.hasPermission(auditor, "delete_invoices")).toBe(false);
  });

  // Test 5: Multiple permission checking
  test("Multiple permission validation should work correctly", () => {
    const manager = mockUsers.manager;

    // Should have any of these permissions
    expect(
      AuthService.hasAnyPermission(manager, [
        "generate_reports",
        "manage_users",
      ])
    ).toBe(true);

    // Should not have all of these permissions
    expect(
      AuthService.hasAllPermissions(manager, [
        "generate_reports",
        "manage_users",
      ])
    ).toBe(false);

    // Should have all of these permissions
    expect(
      AuthService.hasAllPermissions(manager, [
        "generate_reports",
        "export_data",
      ])
    ).toBe(true);
  });

  // Test 6: Route access validation
  test("Route access validation should work correctly", () => {
    const admin = mockUsers.admin;
    const auditor = mockUsers.auditor;

    // Admin should access admin routes
    expect(
      AuthService.canAccessRoute(admin, {
        requiresAuth: true,
        allowedRoles: ["admin"],
      })
    ).toBe(true);

    // Auditor should not access admin routes
    expect(
      AuthService.canAccessRoute(auditor, {
        requiresAuth: true,
        allowedRoles: ["admin"],
      })
    ).toBe(false);

    // Both should access general authenticated routes
    expect(
      AuthService.canAccessRoute(admin, {
        requiresAuth: true,
      })
    ).toBe(true);

    expect(
      AuthService.canAccessRoute(auditor, {
        requiresAuth: true,
      })
    ).toBe(true);
  });

  // Test 7: Session management
  test("Session storage and retrieval should work", () => {
    // Clear storage first
    localStorage.clear();

    // Should return null when no user stored
    expect(AuthService.getCurrentUser()).toBeNull();
    expect(AuthService.isAuthenticated()).toBe(false);

    // Store user data
    const mockAuthData = {
      user: mockUsers.admin,
      token: "test-token",
      expiresIn: Date.now() + 8 * 60 * 60 * 1000, // 8 hours from now
    };

    localStorage.setItem(
      "invoice_validation_auth",
      JSON.stringify(mockAuthData)
    );

    // Should retrieve stored user
    const currentUser = AuthService.getCurrentUser();
    expect(currentUser.username).toBe("admin");
    expect(AuthService.isAuthenticated()).toBe(true);
  });

  // Test 8: Token expiration
  test("Expired tokens should be handled correctly", () => {
    // Store expired token
    const expiredAuthData = {
      user: mockUsers.admin,
      token: "expired-token",
      expiresIn: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
    };

    localStorage.setItem(
      "invoice_validation_auth",
      JSON.stringify(expiredAuthData)
    );

    // Should return null for expired token
    expect(AuthService.getCurrentUser()).toBeNull();
    expect(AuthService.isAuthenticated()).toBe(false);

    // Storage should be cleared
    expect(localStorage.getItem("invoice_validation_auth")).toBeNull();
  });

  // Test 9: Logout functionality
  await test("Logout should clear session data", async () => {
    // Set up session data
    localStorage.setItem(
      "invoice_validation_auth",
      JSON.stringify({
        user: mockUsers.admin,
        token: "test-token",
        expiresIn: Date.now() + 8 * 60 * 60 * 1000,
      })
    );
    localStorage.setItem("invoice_validation_token", "test-token");

    // Logout
    await AuthService.logout();

    // Verify data is cleared
    expect(localStorage.getItem("invoice_validation_auth")).toBeNull();
    expect(localStorage.getItem("invoice_validation_token")).toBeNull();
  });

  // Test 10: Custom permissions
  test("Custom permissions beyond role should work", () => {
    const customUser = mockUsers.customPermissionUser;

    // Should have custom permissions
    expect(AuthService.hasPermission(customUser, "generate_reports")).toBe(
      true
    );
    expect(AuthService.hasPermission(customUser, "export_data")).toBe(true);

    // Should not have admin permissions
    expect(AuthService.hasPermission(customUser, "manage_users")).toBe(false);
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log("🎉 All authentication tests passed!");
    return true;
  } else {
    console.log("💥 Some tests failed. Check implementation.");
    return false;
  }
}

// Run the tests
runAuthTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test runner error:", error);
    process.exit(1);
  });
