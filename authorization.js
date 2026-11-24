
const USERS = {
    alice: {
        roles: ["COMPLIANCE_ANALYST"]
    },
    bob: {
        roles: ["OPERATIONS_ANALYST"]
    },
    charlie: {
        roles: ["ADMIN"]
    }
};

const POLICY_ACCESS = {
    banking_policy: ["COMPLIANCE_ANALYST"],
    domestic_policy: ["OPERATIONS_ANALYST"]
};

export function authorizePolicyAccess(userId, documentId) {
    // 1. Verify authenticated identity exists
    const user = USERS[userId];

    if (!user) {
        const error = new Error("Authentication required");
        error.statusCode = 401;
        throw error;
    }

    // 2. Check whether the policy has an access configuration
    const allowedRoles = POLICY_ACCESS[documentId];

    if (!allowedRoles) {
        const error = new Error("Access denied");
        error.statusCode = 403;
        throw error;
    }

    // 3. Administrator has access to all configured policies
    if (user.roles.includes("ADMIN")) {
        return true;
    }

    // 4. Verify role-based access
    const hasAccess = user.roles.some(
        role => allowedRoles.includes(role)
    );

    if (!hasAccess) {
        const error = new Error("Access denied");
        error.statusCode = 403;
        throw error;
    }

    return true;
}
