import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(path.resolve(), 'backend/data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (modelName) => path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);

const readJSON = (modelName) => {
  const file = getFilePath(modelName);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([]));
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
};

const writeJSON = (modelName, data) => {
  const file = getFilePath(modelName);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const makeSaveable = (obj, modelName, array) => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => makeSaveable(item, modelName, array));
  }
  
  // Attach save method
  Object.defineProperty(obj, 'save', {
    value: async function() {
      const idx = array.findIndex(item => item._id.toString() === this._id.toString());
      if (idx > -1) {
        array[idx] = { ...this };
      } else {
        array.push(this);
      }
      writeJSON(modelName, array);
      return this;
    },
    enumerable: false,
    writable: true,
    configurable: true
  });

  // Attach delete method
  Object.defineProperty(obj, 'deleteOne', {
    value: async function() {
      const filtered = array.filter(item => item._id.toString() !== this._id.toString());
      writeJSON(modelName, filtered);
      return { deletedCount: 1 };
    },
    enumerable: false,
    writable: true,
    configurable: true
  });

  // Attach sub-document id lookups (reviews and faqs)
  if (obj.reviews && Array.isArray(obj.reviews)) {
    obj.reviews.forEach(r => {
      if (!r._id) r._id = new mongoose.Types.ObjectId().toString();
    });
    Object.defineProperty(obj.reviews, 'id', {
      value: function(id) {
        const found = this.find(r => r._id.toString() === id.toString());
        return found ? makeSaveable(found, modelName, array) : null;
      },
      enumerable: false
    });
  }

  if (obj.faqs && Array.isArray(obj.faqs)) {
    obj.faqs.forEach(f => {
      if (!f._id) f._id = new mongoose.Types.ObjectId().toString();
    });
    Object.defineProperty(obj.faqs, 'id', {
      value: function(id) {
        const found = this.find(f => f._id.toString() === id.toString());
        return found ? makeSaveable(found, modelName, array) : null;
      },
      enumerable: false
    });
  }

  return obj;
};

// Check if mongoose is connected
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Generic Wrapper Model
export const getModel = (modelName, MongooseModel) => {
  return {
    find: (query = {}) => {
      if (isConnected()) {
        return MongooseModel.find(query);
      }
      const data = readJSON(modelName);
      let filtered = [...data];
      
      // Basic query matching
      Object.keys(query).forEach(key => {
        if (key === '$or' && Array.isArray(query[key])) {
          filtered = filtered.filter(item => {
            return query[key].some(subQuery => {
              return Object.keys(subQuery).some(subKey => {
                if (subQuery[subKey].$regex) {
                  const pattern = new RegExp(subQuery[subKey].$regex, subQuery[subKey].$options || '');
                  return pattern.test(item[subKey] || '');
                }
                return item[subKey] === subQuery[subKey];
              });
            });
          });
        } else if (query[key] && typeof query[key] === 'object') {
          // Range filters like price: { $gte: min, $lte: max }
          if (query[key].$gte !== undefined) {
            filtered = filtered.filter(item => item[key] >= query[key].$gte);
          }
          if (query[key].$lte !== undefined) {
            filtered = filtered.filter(item => item[key] <= query[key].$lte);
          }
          if (query[key].$ne !== undefined) {
            filtered = filtered.filter(item => item[key] !== query[key].$ne);
          }
          if (query[key].$gt !== undefined) {
            filtered = filtered.filter(item => item[key] > query[key].$gt);
          }
        } else if (query[key] !== undefined) {
          filtered = filtered.filter(item => item[key] === query[key]);
        }
      });

      // Returns mock query runner supporting sorting and pagination
      const runner = {
        data: filtered,
        sort: function(sortObj) {
          const sortKey = Object.keys(sortObj)[0];
          const order = sortObj[sortKey];
          this.data.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return order === 1 ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return order === 1 ? 1 : -1;
            return 0;
          });
          return this;
        },
        limit: function(lim) {
          this._limit = lim;
          return this;
        },
        skip: function(sk) {
          this._skip = sk;
          return this;
        },
        populate: function() {
          // Simple mock population
          return this;
        },
        then: function(resolve) {
          let slicedData = [...this.data];
          if (this._skip !== undefined) {
            slicedData = slicedData.slice(this._skip);
          }
          if (this._limit !== undefined) {
            slicedData = slicedData.slice(0, this._limit);
          }
          resolve(makeSaveable(slicedData, modelName, data));
        }
      };
      
      // Make it act like a promise
      Object.defineProperty(runner, 'then', { enumerable: false });
      return runner;
    },

    findById: async (id) => {
      if (isConnected()) {
        return MongooseModel.findById(id);
      }
      const data = readJSON(modelName);
      const found = data.find(item => item._id.toString() === id.toString());
      return found ? makeSaveable(found, modelName, data) : null;
    },

    findOne: async (query = {}) => {
      if (isConnected()) {
        return MongooseModel.findOne(query);
      }
      const data = readJSON(modelName);
      const found = data.find(item => {
        return Object.keys(query).every(key => {
          if (query[key] && query[key].$ne !== undefined) {
            return item[key] !== query[key].$ne;
          }
          return item[key] === query[key];
        });
      });
      return found ? makeSaveable(found, modelName, data) : null;
    },

    create: async (docData) => {
      if (isConnected()) {
        return MongooseModel.create(docData);
      }
      const data = readJSON(modelName);
      const newDoc = {
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...docData
      };
      data.push(newDoc);
      writeJSON(modelName, data);
      return makeSaveable(newDoc, modelName, data);
    },

    updateOne: async (query, updateData) => {
      if (isConnected()) {
        return MongooseModel.updateOne(query, updateData);
      }
      const data = readJSON(modelName);
      const idx = data.findIndex(item => {
        return Object.keys(query).every(key => item[key] === query[key]);
      });
      if (idx > -1) {
        data[idx] = { ...data[idx], ...updateData, updatedAt: new Date().toISOString() };
        writeJSON(modelName, data);
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    },

    deleteOne: async (query) => {
      if (isConnected()) {
        return MongooseModel.deleteOne(query);
      }
      const data = readJSON(modelName);
      const initialLength = data.length;
      const filtered = data.filter(item => {
        return !Object.keys(query).every(key => item[key]?.toString() === query[key]?.toString());
      });
      writeJSON(modelName, filtered);
      return { deletedCount: initialLength - filtered.length };
    },

    deleteMany: async (query = {}) => {
      if (isConnected()) {
        return MongooseModel.deleteMany(query);
      }
      writeJSON(modelName, []);
      return { deletedCount: 999 };
    },

    countDocuments: async (query = {}) => {
      if (isConnected()) {
        return MongooseModel.countDocuments(query);
      }
      const data = readJSON(modelName);
      let filtered = [...data];
      Object.keys(query).forEach(key => {
        if (key === '$or' && Array.isArray(query[key])) {
          filtered = filtered.filter(item => {
            return query[key].some(subQuery => {
              return Object.keys(subQuery).some(subKey => {
                if (subQuery[subKey].$regex) {
                  const pattern = new RegExp(subQuery[subKey].$regex, subQuery[subKey].$options || '');
                  return pattern.test(item[subKey] || '');
                }
                return item[subKey] === subQuery[subKey];
              });
            });
          });
        } else if (query[key] !== undefined) {
          filtered = filtered.filter(item => item[key] === query[key]);
        }
      });
      return filtered.length;
    },

    insertMany: async (arr) => {
      if (isConnected()) {
        return MongooseModel.insertMany(arr);
      }
      const data = readJSON(modelName);
      const inserted = arr.map(item => ({
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...item
      }));
      const newData = [...data, ...inserted];
      writeJSON(modelName, newData);
      return makeSaveable(inserted, modelName, newData);
    }
  };
};
