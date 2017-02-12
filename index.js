'use strict'

/**
 * @class NGNX.DATA.DatabaseProxy
 * This is a base class for backend database connections.
 * It is specifically designed for Node.js (not the browser).
 * This class contains generic methods and attributes for
 * managing things like simple data encryption and post
 * save/fetch operations.
 */
class DatabaseProxy extends NGN.DATA.Proxy {
  constructor (config) {
    config = config || {}

    super(config)

    Object.defineProperties(this, {
      /**
       * @cfg {string} [encryptionKey=null]
       * Set this to a hash key to obfuscate (scramble) the data. This is a
       * reversible hashing method and should not be considered "secure", but it
       * will make the file on disk unreadable to a human if they do not have
       * the key.
       */
      munge: NGN.private(NGN.coalesce(config.encryptionKey, null)),

      /**
       * @cfg {string} [cipher=aes-256-cbc]
       * The type of cipher to use when encrypting/decrypting data at rest.
       * This is only applied if #encryptionKey is provided.
       */
      cipher: NGN.privateconst(NGN.coalesce(config.cipher, 'aes-256-cbc'))
    })
  }

  /**
   * @method encrypt
   * Encrypt text using the configured #cipher and #encryptionKey.
   * @param {string} decryptedContent
   * The content to be encrypted.
   * @private
   */
  encrypt (data) {
    let cipher = require('crypto').createCipher(this.cipher, this.munge)
    let encoded = cipher.update(data, 'utf8', 'hex')
    encoded += cipher.final('hex')
    return encoded
  }

  /**
   * @method decrypt
   * Decrypt text using the configured #cipher and #encryptionKey.
   * @param {string} encryptedContent
   * The content to be decrypted.
   * @private
   */
  decrypt (data) {
    let cipher = require('crypto').createDecipher(this.cipher, this.munge)
    let decoded = cipher.update(data, 'hex', 'utf8')
    decoded += cipher.final('utf8')
    return decoded
  }

  /**
   * @method postsave
   * Cleanup after the save operation is complete.
   * @param {function} [callback]
   * An optional callback method to fire after the save is complete.
   * @private
   */
  postsave (callback) {
    this.emit('save')
    this.store.emit('save')

    if (NGN.isFn(callback)) {
      callback()
    }
  }

  /**
   * @method postfetch
   * A helper method to cleanup after fetching data.
   * @param {function} [callback]
   * An optional callback method to fire after the save is complete.
   * @param {any} content
   * The content to send to the callback/event handler.
   * @fires fetch
   * @private
   */
  postfetch (callback, content) {
    this.emit('fetch', content)
    this.store.emit('fetch', content)

    if (NGN.isFn(callback)) {
      callback(content)
    }
  }
}

global.NGNX = NGN.coalesce(global.NGNX, {DATA: {}})
global.NGNX.DATA = NGN.coalesce(global.NGNX.DATA, {})
Object.defineProperty(global.NGNX.DATA, 'DatabaseProxy', NGN.const(DatabaseProxy))
