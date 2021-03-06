const mongoose = require("mongoose");
const mongoCreate = require('../utils/mongoCreate.js')
const camelcase = require('camelcase')
Array.prototype.asyncForEach = async function (callback) {
  for (let i = 0; i < this.length; i++) {
    await callback(this[i], i);
  }
};
module.exports = {
  browse: async (req, res) => {
    try {
      let Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      if (!Model) Model = mongoose.connection.models[camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1)]
      let query = req.query
      let limit = ''
      if (query.limit) {
          limit = parseInt(req.query.limit)
        delete query['limit']
      }
      let sort = '-createdAt'
      if (query.sort) {
        if (query.direction) {
          sort = req.query.direction + req.query.sort
          delete query['direction'];
        } else {
          sort = req.query.sort
        }
        delete query['sort'];
      }
      let skip = 0
      if (query.skip) {
        skip = req.query.skip
        delete query['skip'];
      }
      const data = await Model.find(req.query).sort(sort).skip(skip).limit(limit)
      res.status(200).json(data)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  edit: async (req, res) => {
    try {
      let Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      if (!Model) Model = mongoose.connection.models[camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1)]
      const data = await Model.updateMany(req.body.filters, req.body.updates)
      const io = req.app.get('socketio');
      io.emit('breadUpdate', data);
      const respond = await Model.find(req.body.filters)
      const roomId = respond[0]._id.toString()
      // io.sockets.in(respond[0]._id).emit('message', respond);
      io.sockets.in(roomId).emit('room updated', JSON.stringify(respond[0]));
      console.log('data pushed', respond)
      res.status(200).json(respond)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  push: async (req, res) => {
    try {
      let Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      if (!Model) Model = mongoose.connection.models[camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1)]
      const push = req.body.push
      let data
      let item = await Model.find(req.body.filters)
      await Object.keys(push).asyncForEach(async (key) => {
        data = await Model.updateMany(req.body.filters, {
          $push: { [key]: push[key] }
       })
      })
      const io = req.app.get('socketio');
      io.emit('breadUpdate', data);
      const respond = await Model.find(req.body.filters)
      const roomId = respond[0]._id.toString()
      // io.sockets.in(respond[0]._id).emit('message', respond);
      io.sockets.in(roomId).emit('room updated', JSON.stringify(respond[0]));
      console.log('data pushed', JSON.stringify(respond))
      res.status(200).json(respond)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  add: async (req, res) => {
    try {
      const Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      console.log(camelcase(req.params.bread))
      let data = await Model.create(req.body)
      const io = req.app.get('socketio');
      io.emit('breadUpdate', data);
      res.status(200).json(data)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  },

  destroy: async (req, res) => {
    try {
      let Model = mongoCreate.mongoModels[camelcase(req.params.bread)]
      console.log(camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1))
      if (!Model) Model = mongoose.connection.models[camelcase(req.params.bread)[0].toUpperCase() + req.params.bread.substring(1)]
      console.log(Model)
      const data = await Model.deleteOne({_id: req.query.id})
      console.log(data)
      res.status(200).json(data)
    } catch (err) {
      console.log(err)
      res.status(400).json(err)
    }
  }
}
