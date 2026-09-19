module.exports = {
  HOST: 'ep-wandering-glade-b5bntx7r-pooler.c-7.us-east-2.aws.neon.tech',
  USER: 'neondb_owner',
  PASSWORD: 'npg_QOrwVfagE4F6',
  DB: "neondb",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

