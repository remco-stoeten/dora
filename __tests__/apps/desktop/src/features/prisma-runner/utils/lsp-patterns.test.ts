import { describe, expect, it } from 'vitest'
import {
	detectPrismaContext,
	type PrismaContext
} from '@/features/prisma-runner/utils/lsp-patterns'

describe('detectPrismaContext', function () {
	it('detects model-key after prisma.', function () {
		expect(detectPrismaContext('prisma.')).toEqual({ type: 'model-key' })
		expect(detectPrismaContext('const x = prisma.us')).toEqual({ type: 'model-key' })
	})

	it('detects method after prisma.<model>.', function () {
		expect(detectPrismaContext('prisma.user.')).toEqual({ type: 'method', modelKey: 'user' })
		expect(detectPrismaContext('prisma.userProfile.find')).toEqual({
			type: 'method',
			modelKey: 'userProfile'
		})
	})

	it('detects where-field inside a where object', function () {
		expect(detectPrismaContext('prisma.user.findMany({ where: { ')).toEqual({
			type: 'where-field',
			modelKey: 'user'
		})
		expect(detectPrismaContext('prisma.user.findMany({ where: { em')).toEqual({
			type: 'where-field',
			modelKey: 'user'
		})
	})

	it('detects field-operator inside a nested field object', function () {
		expect(detectPrismaContext('prisma.user.findMany({ where: { email: { ')).toEqual({
			type: 'field-operator',
			modelKey: 'user',
			field: 'email'
		})
		expect(detectPrismaContext('prisma.user.findMany({ where: { email: { cont')).toEqual({
			type: 'field-operator',
			modelKey: 'user',
			field: 'email'
		})
	})

	it('detects orderby-field inside an orderBy object', function () {
		expect(detectPrismaContext('prisma.user.findMany({ orderBy: { ')).toEqual({
			type: 'orderby-field',
			modelKey: 'user'
		})
	})

	it('detects orderby-direction after a field key in orderBy', function () {
		expect(detectPrismaContext('prisma.user.findMany({ orderBy: { email: ')).toEqual({
			type: 'orderby-direction'
		})
		expect(detectPrismaContext("prisma.user.findMany({ orderBy: { email: 'a")).toEqual({
			type: 'orderby-direction'
		})
	})

	it('detects include-field inside an include object', function () {
		expect(detectPrismaContext('prisma.post.findMany({ include: { ')).toEqual({
			type: 'include-field',
			modelKey: 'post'
		})
	})

	it('detects raw-method after prisma.$', function () {
		expect(detectPrismaContext('prisma.$')).toEqual({ type: 'raw-method' })
		expect(detectPrismaContext('await prisma.$query')).toEqual({ type: 'raw-method' })
	})

	it('returns unknown for unrelated text', function () {
		const result: PrismaContext = detectPrismaContext('const x = 1')
		expect(result).toEqual({ type: 'unknown' })
		expect(detectPrismaContext('prisma')).toEqual({ type: 'unknown' })
	})

	it('does not fire clause contexts once the clause object is closed', function () {
		expect(detectPrismaContext('prisma.user.findMany({ where: { id: 1 } }).')).toEqual({
			type: 'unknown'
		})
	})
})
