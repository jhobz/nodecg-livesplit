'use strict';
const LiveSplitClient = require('livesplit-client')

module.exports = nodecg => {
	const rLivesplit = nodecg.Replicant('livesplit')
	const client = new LiveSplitClient(`${nodecg.bundleConfig.url}:${nodecg.bundleConfig.port}`)
	let timerHandle

	// Reset info since connection has been reset
	rLivesplit.value.connection.status = 'disconnected'
	rLivesplit.value.timer = undefined

	client.on('connected', () => {
		nodecg.log.info('Connected to ls')
		rLivesplit.value.connection.status = 'connected'
		timerHandle = setInterval(async () => {
			try {
				rLivesplit.value.timer = await client.getAll()
			} catch (err) {
				nodecg.log.error(err)
			}
			nodecg.log.info(rLivesplit.value)
		}, 150)
	})

	client.on('disconnected', () => {
		nodecg.log.info('Disconnected from ls')
		rLivesplit.value.connection.status = 'disconnected'
		rLivesplit.value.timer = undefined
	})

	// Message: connect
	nodecg.listenFor('connect', async (_, ack) => {
		if (rLivesplit.value.connection.status === 'connected') {
			ack(null)
			return
		}

		try {
			await client.connect()
		} catch (err) {
			ack(new Error('Could not connect to LiveSplit. Is the LiveSplit Server running?', err))
		}

		ack(null)
	})

	// Message: disconnect
	nodecg.listenFor('disconnect', (_, ack) => {
		if (rLivesplit.value.connection.status === 'disconnected') {
			ack(null)
			return
		}

		try {
			clearInterval(timerHandle)
			client.disconnect()
		} catch (err) {
			ack(new Error('Could not disconnect from LiveSplit.', err))
		}

		ack(null)
	})
}
