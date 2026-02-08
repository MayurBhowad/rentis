import type { Connection } from 'mongoose';
import * as m001 from './001_example';

export interface Migration {
  name: string;
  description?: string;
  up: (conn: Connection) => Promise<void>;
}

export const migrations: Migration[] = [
  { name: m001.name, description: m001.description, up: m001.up },
  // Add new migrations here, e.g.:
  // { name: m002.name, description: m002.description, up: m002.up },
];
