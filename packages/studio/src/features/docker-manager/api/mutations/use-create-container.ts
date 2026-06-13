import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DatabaseContainerConfig, CreateContainerResult } from '../../types'
import { createDatabaseContainer, waitForHealthy } from '../container-service'
import { useDockerManagerStore } from '../../stores/docker-manager-store'

type UseCreateContainerOptions = {
	onSuccess?: (result: CreateContainerResult, config: DatabaseContainerConfig) => void
	onError?: (error: Error) => void
	waitForHealth?: boolean
}

export function useCreateContainer(options: UseCreateContainerOptions = {}) {
	const { onSuccess, onError, waitForHealth = true } = options
	const queryClient = useQueryClient()
	const addEvent = useDockerManagerStore(function (s) {
		return s.addEvent
	})

	return useMutation<CreateContainerResult, Error, DatabaseContainerConfig>({
		mutationFn: async function (config) {
			const result = await createDatabaseContainer(config)

			if (result.success && result.containerId && waitForHealth) {
				const isHealthy = await waitForHealthy(result.containerId, 30000, 1000)
				if (!isHealthy) {
					throw new Error('Container created but failed to become healthy within 30s')
				}
			}

			if (!result.success) {
				throw new Error(result.error || 'Failed to create container')
			}

			return result
		},
		onSuccess: function (result, config) {
			queryClient.invalidateQueries({ queryKey: ['docker-containers'] })
			if (result.success && result.containerId) {
				addEvent({
					containerId: result.containerId,
					containerName: config.name,
					type: 'created'
				})
			}
			if (onSuccess) {
				onSuccess(result, config)
			}
		},
		onError: function (error) {
			if (onError) {
				onError(error)
			}
		}
	})
}
