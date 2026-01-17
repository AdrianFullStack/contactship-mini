import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('leads')
export class Lead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({
        type: 'enum',
        enum: ['manual', 'external'],
        default: 'manual',
    })
    source: string;

    @Column({ nullable: true, type: 'text' })
    summary: string;

    @Column({ name: 'next_action', nullable: true, type: 'text' })
    nextAction: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}