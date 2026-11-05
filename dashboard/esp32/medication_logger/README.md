# Registro de medicação — XIAO ESP32-C3

Uma pressão no botão registra **uma tomada informada pelo usuário**, para um medicamento configurado. O ESP32 salva primeiro no SD; a plataforma solicita os pendentes por BLE e confirma cada registro após salvá-lo. O horário usa UTC, sincronizado por Wi-Fi na inicialização e a cada seis horas. Não é necessário manter o Wi-Fi conectado entre sincronizações.

## Ligações propostas

| Componente | Pino XIAO | GPIO | Ligação |
|---|---|---|---|
| Botão externo | D1 | 3 | Entre pino e GND, `INPUT_PULLUP` |
| LED verde | D2 | 4 | Pino → resistor 330 Ω → anodo; catodo → GND |
| LED âmbar | D3 | 5 | Pino → resistor 330 Ω → anodo; catodo → GND |
| SD SCK | D4 | 6 | SPI remapeado |
| SD MISO | D5 | 7 | SPI remapeado |
| SD MOSI | D6 | 21 | SPI remapeado |
| SD CS | D7 | 20 | Chip select |
| SD alimentação | 3V3 / GND | — | Módulo compatível com sinais de 3,3 V |

Use cartão FAT32. O mapeamento SPI foi escolhido para não usar GPIO2/8/9, que participam do modo de inicialização do C3. Os LEDs são externos; o LED onboard do XIAO C3 não é um LED programável. Se seu módulo SD tiver regulador que exige 5 V, verifique sua alimentação e compatibilidade dos sinais antes da montagem. Pinos editáveis em `config.h`.

## Instalação

1. No Arduino IDE, instale **esp32 by Espressif Systems 3.3.11** e selecione **XIAO_ESP32C3**. O firmware usa apenas bibliotecas desse pacote.
2. Abra `medication_logger.ino`.
3. Copie `secrets.example.h` para `secrets.h`; configure Wi-Fi 2,4 GHz e um PIN BLE de seis dígitos. O arquivo privado não entra no git.
4. Ajuste `MEDICATION_ID` em `config.h`, usando apenas letras, números, `_` ou `-`.
5. Grave por USB, com os componentes conectados conforme a tabela. Monitor serial: 115200 baud.

Se o compilador escolher uma biblioteca avulsa antiga chamada `ESP32_BLE_Arduino`, ela conflita com a biblioteca BLE do pacote atual. Na verificação deste projeto, foi selecionada explicitamente a biblioteca do core com `arduino-cli compile --fqbn esp32:esp32:XIAO_ESP32C3 --library <pasta-do-core>/libraries/BLE esp32/medication_logger`, sem modificar as bibliotecas instaladas. No IDE, confira no log qual biblioteca foi escolhida.

Não altere `MEDICATION_ID` para representar outros medicamentos sem deixar o novo firmware registrar os novos eventos: cada arquivo já guarda o ID usado quando o botão foi pressionado.

## Botão, LEDs e relógio

- Pressionar e soltar: um evento; debounce de 40 ms. Segurar não gera registros repetidos.
- Verde acende por 700 ms **depois** de verificar a gravação no SD.
- Âmbar: piscadas rápidas indicam problema de armazenamento; piscadas lentas indicam que ainda não houve sincronização do relógio neste boot; aceso indica conexão BLE; apagado indica operação offline com relógio sincronizado.
- Wi-Fi tenta NTP na inicialização; após sucesso, repete seis horas depois. Se falhar, tenta novamente em um minuto. A leitura do botão e o BLE continuam funcionando durante essas tentativas.
- O relógio continua contando offline durante o mesmo boot. Sem sincronização após reiniciar, `taken_at_epoch` é `null`: o aparelho conserva `uptime_ms` e não inventa uma data. Um RTC externo com bateria seria necessário para manter a hora exata após perda de energia sem Wi-Fi.
- `last_clock_sync_epoch` permite saber quão antiga é a última sincronização. `clock_synced_this_boot` não significa que uma nova consulta NTP ocorreu exatamente no momento da tomada.

## Dados e confirmação de entrega

No SD: `/medication/<id>.rec` contém o evento original; `<id>.ack` contém a confirmação de envio. Ambos usam payload CSV versionado e uma linha de checksum FNV-1a. Arquivos são escritos em `.tmp`, verificados e renomeados; arquivos temporários não entram no relatório. Isso detecta gravações incompletas, embora FAT/SD não garantam resistência absoluta a cortes de energia.

O evento não é reescrito para mudar uma flag. A **visão lógica** do registro combina `.rec` com `.ack` e retorna:

```json
{
  "type": "record",
  "id": "AABBCCDDEEFF-00000001-00000001",
  "medication_id": "medication",
  "taken_at_epoch": 1791450000,
  "uptime_ms": 1234,
  "clock_synced_this_boot": true,
  "last_clock_sync_epoch": 1791449900,
  "sent_to_platform": false,
  "sent_at_epoch": null,
  "ack_received_at_epoch": null
}
```

Depois da confirmação persistida no SD, `sent_to_platform` passa a `true`; `sent_at_epoch` recebe o instante UTC informado pela plataforma, e `ack_received_at_epoch` guarda o instante local da confirmação (ou `null` se o relógio local ainda não estiver sincronizado). O export JSON do cliente contém a flag e a data de aceitação; o ACK local do aparelho fica no SD. Registros confirmados são conservados, mas não voltam na próxima solicitação de pendentes.

IDs combinam identificador de hardware, contador de inicializações persistido em NVS e sequência por boot. A plataforma deve usar o ID como chave única. Se o ESP32 reiniciar ou perder conexão antes de persistir o ACK, o registro poderá ser reenviado; o receptor aceita esse reenvio sem duplicar nem alterar a primeira data de aceitação. Não apague a NVS mantendo arquivos antigos no SD, pois isso reiniciaria o contador de IDs.

## Protocolo BLE

- Nome anunciado: `Medication-XIAO`.
- Service: `79210001-bca0-4f57-9230-41624b109410`.
- RX, escrita com resposta: `79210002-bca0-4f57-9230-41624b109410`.
- TX, notifications: `79210003-bca0-4f57-9230-41624b109410`.
- Parear com o PIN configurado antes de solicitar dados. O dispositivo exige conexão autenticada/criptografada para processar comandos ou emitir relatórios.

1. Plataforma assina notifications de TX.
2. Escreve `REQUEST\n` em RX.
3. ESP32 transmite um registro JSON pendente, terminado por newline, em fragmentos de até 20 bytes. O receptor deve juntar os fragmentos.
4. Plataforma salva o registro de forma durável e só então escreve `ACK,<id>,<accepted_at_epoch>\n`.
5. ESP32 grava o ACK no SD e envia o próximo registro.
6. Finaliza com `{"type":"done","acknowledged":N}`. Sem pendentes, N é zero.

ACK só é aceito para o ID atualmente enviado, com timestamp válido. Sem ACK em 30 s, a sessão termina com `ack_timeout`; o registro permanece pendente. Reconectar e repetir `REQUEST` retoma os ainda não confirmados. Uma nova solicitação percorre a pasta de novo; não há exclusão de dados após envio. O botão continua registrando enquanto o relatório é transmitido.

## Cliente de teste e ligação com sua plataforma

A plataforma definitiva ainda não foi especificada. Incluí `sync_client.py` como receptor de referência para computador com BLE:

```powershell
python -m pip install -r esp32/medication_logger/requirements.txt
python esp32/medication_logger/sync_client.py
```

Ele solicita o PIN do pareamento, recebe os pendentes, confirma após commit em `data/medication.sqlite3` e exporta `data/medication_report.json`. Essa pasta de dados fica excluída do git. **Nesse modo, a plataforma receptora é esse banco local**, não um serviço remoto. Para uma placa específica, passe `--address <BLE-address>`.

Para uma plataforma HTTP real:

```powershell
python esp32/medication_logger/sync_client.py --platform-url https://sua-plataforma.example/api/medication
```

O receptor faz POST de cada registro com `Idempotency-Key: <id>`. O endpoint deve deduplicar por ID e responder **depois de persistir**:

```json
{"accepted": true, "id": "AABBCCDDEEFF-00000001-00000001", "accepted_at_epoch": 1791450050}
```

Um reenvio deve retornar o mesmo `accepted_at_epoch`. Só após essa confirmação o cliente envia ACK ao ESP32. Token opcional: variável de ambiente `MEDICATION_PLATFORM_TOKEN`. Use um banco local diferente ao mudar a plataforma de destino. Se o serviço estiver indisponível, não há ACK e os registros ficam pendentes no SD.

O Wi-Fi neste firmware serve ao relógio; os dados saem por BLE para um celular/computador, que pode encaminhá-los à plataforma. Para aplicativo móvel, implemente os mesmos UUIDs, enquadramento por newline e confirmação após persistência.

## Verificação

```powershell
python -m unittest discover -s esp32/medication_logger -p "test_*.py" -v
```

Verificado neste workspace: compilação para `esp32:esp32:XIAO_ESP32C3` com core 3.3.11, usando a biblioteca BLE do próprio core (1.276.551 bytes de programa; 37.692 bytes de RAM global), e sete testes Python aprovados. A partição padrão tem 97% do espaço de programa ocupado; para ampliar o firmware, pode ser necessário selecionar uma partição de aplicativo maior no Arduino IDE.

Os testes cobrem fragmentação BLE, deduplicação após reinício, primeira data de aceitação, conflito de ID, falha de plataforma e eventos sem horário sincronizado. Testes físicos ainda precisam verificar botão, SD, relógio, PIN/pareamento BLE e desligamento durante transferência. Remova o SD somente com o dispositivo desligado.

Referências: [pinagem oficial do XIAO C3](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/), [BLE Arduino-ESP32](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ble.html), [exemplo oficial NTP](https://github.com/espressif/arduino-esp32/blob/master/libraries/ESP32/examples/Time/SimpleTime/SimpleTime.ino).
