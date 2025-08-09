/**
 * UserRole interface and data for Salesforce user roles
 */

export interface UserRole {
  Id: string;
  Name: string;
}

/**
 * Profile interface for Salesforce profiles
 */
export interface Profile {
  Id: string;
  Name: string;
}

/**
 * Predefined Salesforce user roles
 */
export const USER_ROLES: UserRole[] = [
  {
    Id: "00E4H000000NyLgUAK",
    Name: "DV - APAC - Manager"
  },
  {
    Id: "00E4H000000NyLhUAK",
    Name: "DV - APAC - User"
  },
  {
    Id: "00E4H000000NyLjUAK",
    Name: "DV - China - Manager"
  },
  {
    Id: "00E4H000000NyLkUAK",
    Name: "DV - China - User"
  },
  {
    Id: "00E4H000000NyLmUAK",
    Name: "DV - EMEA - Manager"
  },
  {
    Id: "00E4H000000NyLnUAK",
    Name: "DV - EMEA - User"
  },
  {
    Id: "00E4H000000NyLrUAK",
    Name: "DV - North America - Manager"
  },
  {
    Id: "00E4H000000NyLsUAK",
    Name: "DV - North America - User"
  },
  {
    Id: "00E4H000000NyLuUAK",
    Name: "DV - South America - Manager"
  },
  {
    Id: "00E4H000000NyLvUAK",
    Name: "DV - South America - User"
  },
  {
    Id: "00E2o0000021f8gEAA",
    Name: "Pilotfish - User"
  },
  {
    Id: "00E4H000000NvzAUAS",
    Name: "VH - America North User"
  },
  {
    Id: "00E4H000000NvzDUAS",
    Name: "VH - America South User"
  },
  {
    Id: "00E4H000000NvzGUAS",
    Name: "VH - Asia User"
  },
  {
    Id: "00E4H000000NvzJUAS",
    Name: "VH - EMEA User"
  },
  {
    Id: "00E4H000000NvzMUAS",
    Name: "VH - Global User"
  },
  {
    Id: "00E4H000000NvzPUAS",
    Name: "VP - America North Project User"
  },
  {
    Id: "00E4H000000NvzQUAS",
    Name: "VP - America North User"
  },
  {
    Id: "00E4H000000NvzSUAS",
    Name: "VP - America South Project User"
  },
  {
    Id: "00E4H000000NvzTUAS",
    Name: "VP - America South User"
  },
  {
    Id: "00E4H000000NvzVUAS",
    Name: "VP - Asia Project User"
  },
  {
    Id: "00E4H000000NvzWUAS",
    Name: "VP - Asia User"
  },
  {
    Id: "00E4H000000NvzYUAS",
    Name: "VP - EMEA Project User"
  },
  {
    Id: "00E4H000000NvzZUAS",
    Name: "VP - EMEA User"
  },
  {
    Id: "00E4H000000NvzjUAC",
    Name: "VT - Americas Industry User"
  },
  {
    Id: "00E4H000000NvzlUAC",
    Name: "VT - Americas Mobility User"
  },
  {
    Id: "00E4H000000NvzeUAC",
    Name: "VT - APAC Industry User"
  },
  {
    Id: "00E4H000000NvzgUAC",
    Name: "VT - APAC Mobility User"
  },
  {
    Id: "00E4H000000NvzoUAC",
    Name: "VT - EMEA Industry User"
  },
  {
    Id: "00E4H000000NvzqUAC",
    Name: "VT - EMEA Mobility User"
  }
];

/**
 * Predefined Salesforce profiles
 */
export const PROFILES: Profile[] = [
  {
    Id: "00e2o0000016bWqAAI",
    Name: "OneVoith Service Keyuser"
  },
  {
    Id: "00e2o0000016bXZAAY",
    Name: "OneVoith Service Restricted"
  },
  {
    Id: "00e2o000001YovQAAS",
    Name: "OneVoith MDG user"
  },
  {
    Id: "00e58000000SRSuAAO",
    Name: "OneVoith Keyuser"
  },
  {
    Id: "00e58000000SSQ1AAO",
    Name: "OneVoith Read Only"
  },
  {
    Id: "00e58000000hYUyAAM",
    Name: "OneVoith Manager"
  },
  {
    Id: "00e58000000hYUzAAM",
    Name: "OneVoith Standard Sales User"
  },
  {
    Id: "00ebh000000faM5AAI",
    Name: "OneVoith Keyuser VP"
  },
  {
    Id: "00ebh000000faNhAAI",
    Name: "OneVoith Manager VP"
  },
  {
    Id: "00ebh000000faPJAAY",
    Name: "OneVoith Service Keyuser VP"
  },
  {
    Id: "00ebh000000faSXAAY",
    Name: "OneVoith Service Restricted VP"
  },
  {
    Id: "00ebh000000faU9AAI",
    Name: "OneVoith Standard Sales User VP"
  }
];

/**
 * Get a user role by ID
 * @param id - The user role ID
 * @returns The user role object or undefined if not found
 */
export function getUserRoleById(id: string): UserRole | undefined {
  return USER_ROLES.find(role => role.Id === id);
}

/**
 * Get a user role by name
 * @param name - The user role name
 * @returns The user role object or undefined if not found
 */
export function getUserRoleByName(name: string): UserRole | undefined {
  return USER_ROLES.find(role => role.Name === name);
}

/**
 * Get all user role names
 * @returns Array of user role names
 */
export function getUserRoleNames(): string[] {
  return USER_ROLES.map(role => role.Name);
}

/**
 * Get all user role IDs
 * @returns Array of user role IDs
 */
export function getUserRoleIds(): string[] {
  return USER_ROLES.map(role => role.Id);
}

/**
 * Get a profile by ID
 * @param id - The profile ID
 * @returns The profile object or undefined if not found
 */
export function getProfileById(id: string): Profile | undefined {
  return PROFILES.find(profile => profile.Id === id);
}

/**
 * Get a profile by name
 * @param name - The profile name
 * @returns The profile object or undefined if not found
 */
export function getProfileByName(name: string): Profile | undefined {
  return PROFILES.find(profile => profile.Name === name);
}

/**
 * Get all profile names
 * @returns Array of profile names
 */
export function getProfileNames(): string[] {
  return PROFILES.map(profile => profile.Name);
}

/**
 * Get all profile IDs
 * @returns Array of profile IDs
 */
export function getProfileIds(): string[] {
  return PROFILES.map(profile => profile.Id);
}
