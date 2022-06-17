import { Client, GuildMember, PartialGuildMember } from 'discord.js';
import { ROLES, STAFF_ROLES } from '../roles';
import { ROLE_CHANGED, wasAnyRoleChanged } from '../utils/roles';
import { RoleDiff } from '../utils/role-diff';
import { DiffCacheManager } from '../managers/diff-cache-manager';
import { logger } from '../utils/logger';

export function autoVerify(diff: RoleDiff, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember | PartialGuildMember) {
    if (oldMember.pending && !newMember.pending) {
        logger.info('User verified, adding roles...');

        diff.add(
            ROLES.GUESTS,
            ROLES.PRONOUNS_HEADER,
            ROLES.PRONOUNS_FOOTER,
        );
    }
}

export function autoAssignGuestAndStaff(diff: RoleDiff, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember | PartialGuildMember) {
    const STAFF_CHANGED = wasAnyRoleChanged(oldMember, newMember, STAFF_ROLES);

    if (STAFF_CHANGED === ROLE_CHANGED.ADDED) {
        diff.remove(ROLES.GUESTS);
        diff.add(ROLES.STAFF);
    } else if (STAFF_CHANGED === ROLE_CHANGED.REMOVED) {
        diff.remove(ROLES.STAFF);
        diff.add(ROLES.GUESTS);
    }
}

export async function onGuildMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember | PartialGuildMember) {
    const diff = DiffCacheManager.diff(newMember);

    autoVerify(diff, oldMember, newMember);
    // TODO: Causing problems so disabling for rn
    // autoAssignGuestAndStaff(diff, oldMember, newMember);

    await DiffCacheManager.commit(newMember);
}

export async function onGuildMemberAdd(member: GuildMember | PartialGuildMember) {
    const diff = DiffCacheManager.diff(member);

    // TODO: Remove once Sapphire supports Bot Join Roles
    if (member.user.bot) {
        diff.add(ROLES.BOTS);
    }

    await DiffCacheManager.commit(member);
}

export function setup(client: Client) {
    client.on('guildMemberAdd', onGuildMemberAdd);
    client.on('guildMemberUpdate', onGuildMemberUpdate);
}