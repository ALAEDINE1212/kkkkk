// seedAuth.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Admin SDK with only your service account (and optional projectId)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'kicknegooss'
});

// List of users to create or update
const users = [
  { uid: 'UID_admin',     email: 'admin@kiknegos.com',    password: 'Admin123!'  },
  { uid: 'UID_worker_1',  email: 'worker1@kiknegos.com',  password: 'Worker1Pass!'  },
  { uid: 'UID_worker_2',  email: 'worker2@kiknegos.com',  password: 'Worker2Pass!'  },
  { uid: 'UID_worker_3',  email: 'worker3@kiknegos.com',  password: 'Worker3Pass!'  },
  { uid: 'UID_worker_4',  email: 'worker4@kiknegos.com',  password: 'Worker4Pass!'  },
  { uid: 'UID_worker_5',  email: 'worker5@kiknegos.com',  password: 'Worker5Pass!'  },
  { uid: 'UID_worker_6',  email: 'worker6@kiknegos.com',  password: 'Worker6Pass!'  },
  { uid: 'UID_worker_7',  email: 'worker7@kiknegos.com',  password: 'Worker7Pass!'  },
  { uid: 'UID_worker_8',  email: 'worker8@kiknegos.com',  password: 'Worker8Pass!'  },
  { uid: 'UID_worker_9',  email: 'worker9@kiknegos.com',  password: 'Worker9Pass!'  },
  { uid: 'UID_worker_10', email: 'worker10@kiknegos.com', password: 'Worker10Pass!' },
  { uid: 'UID_worker_11', email: 'worker11@kiknegos.com', password: 'Worker11Pass!' },
  { uid: 'UID_worker_12', email: 'worker12@kiknegos.com', password: 'Worker12Pass!' },
  { uid: 'UID_worker_13', email: 'worker13@kiknegos.com', password: 'Worker13Pass!' },
  { uid: 'UID_worker_14', email: 'worker14@kiknegos.com', password: 'Worker14Pass!' },
  { uid: 'UID_worker_15', email: 'worker15@kiknegos.com', password: 'Worker15Pass!' },
  { uid: 'UID_worker_16', email: 'worker16@kiknegos.com', password: 'Worker16Pass!' },
  { uid: 'UID_worker_17', email: 'worker17@kiknegos.com', password: 'Worker17Pass!' },
  { uid: 'UID_worker_18', email: 'worker18@kiknegos.com', password: 'Worker18Pass!' },
  { uid: 'UID_worker_19', email: 'worker19@kiknegos.com', password: 'Worker19Pass!' },
  { uid: 'UID_worker_20', email: 'worker20@kiknegos.com', password: 'Worker20Pass!' },
  { uid: 'UID_worker_21', email: 'worker21@kiknegos.com', password: 'Worker21Pass!' },
  { uid: 'UID_worker_22', email: 'worker22@kiknegos.com', password: 'Worker22Pass!' }
];

async function seed() {
  for (const u of users) {
    try {
      // Try to create the user
      await admin.auth().createUser({
        uid: u.uid,
        email: u.email,
        password: u.password,
        emailVerified: false
      });
      console.log(`Created ${u.email}`);
    } catch (err) {
      // If user exists, update their password
      if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
        await admin.auth().updateUser(u.uid, { password: u.password });
        console.log(`Updated password for ${u.email}`);
      } else {
        console.error(`Error for ${u.email}:`, err);
      }
    }
  }
  console.log('Seeding complete.');
  process.exit(0);
}

seed();

