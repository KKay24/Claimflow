import { Module } from '@nestjs/common';
import { ApplicationStateMachineService } from './state-machine.service';

@Module({
  providers: [ApplicationStateMachineService],
  exports: [ApplicationStateMachineService],
})
export class StateMachineModule {}
