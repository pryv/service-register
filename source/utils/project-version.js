/**
 * @license
 * Copyright (C) 2020 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
// @flow

// Retrieves the projects version from git and from our deploy process. 

const path = require('path');
const fs = require('fs');

const API_VERSION_FILENAME = '.api-version';
const DEFAULT_VERSION = '1.6.0';

// The method '#version' returns a version string for this project; it
// determines it using the following:
// 
//   If the project contains a file called '.api-version' at its root, 
//   the contents of the file are returned as version string.
// 
// The way we find the project root is as follows: Look at the paths in 
// 'process.mainModule' - and try to find the first one which does exist. This
// is where we load our modules from ('node_modules') and we'll expect the 
// .api-version file to be a sibling. 
// 
// Example: 
// 
//  const pv = new ProjectVersion();
//  pv.version(); // => 1.2.3
// 
class ProjectVersion {
  // Returns the projects version number. 
  // 
  version(): string {
    const version = this.readStaticVersion(); 
    if (version != null) return version; 
    
    return DEFAULT_VERSION;
  }
  
  readStaticVersion(): ?string {
    const versionFilePath = path.join(process.cwd(), API_VERSION_FILENAME);
    // If the version file does not exist, give up.
    if (fs.existsSync(versionFilePath)) {
      let versionString = fs.readFileSync(versionFilePath).toString();
      // remove new lines from the start and the end of the string
      return versionString.replace(/^\s+|\s+$/g, '');
    }
    
    // If version was not found, return empty string.
    return null;
  }
}

module.exports = {
  ProjectVersion
};
